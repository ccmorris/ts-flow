import type {
  CatchInput,
  TaskDefinition,
  TaskDefinitions,
  Transition,
  WorkflowResult,
} from './types'
import { matchWithWildcards } from './catch-matcher'
import { log } from './logger'

/**
 * Run the workflow with an initial input
 */
export const run = async <InitialInput>(
  tasks: TaskDefinitions,
  initialInput: InitialInput,
  initialContext: Record<string, unknown> = {}
): Promise<WorkflowResult> => {
  const startTask = Object.values(tasks)[0]
  if (!startTask) throw new Error('No start task found')
  log('startTask', startTask)

  let currentTask: TaskDefinition = startTask
  let currentInput: unknown
  let isEnd = false

  const context = { ...initialContext }

  const transitions: Transition[] = []
  const makeTransition = ({
    transitionName,
    nextTask,
    nextInput,
  }: {
    transitionName: string
    nextTask?: TaskDefinition
    nextInput?: unknown
  }) => {
    transitions.push({ transitionName, nextTask, nextInput })
    if (nextTask) currentTask = nextTask
    currentInput = nextInput
  }
  const endTransition = (output?: unknown) => {
    makeTransition({ transitionName: '(end)' })
    currentInput = output
    isEnd = true
  }

  const successFn = (output: unknown) => {
    log('success', output)
    if (currentTask.type === 'activity' && currentTask.then === null) {
      endTransition(output)
      return
    }

    const nextTaskName =
      currentTask.type === 'activity'
        ? currentTask.then
        : currentTask.choices[`${output}`]
    const transitionName =
      currentTask.type === 'activity' ? 'then' : `${output}`
    const nextTask = tasks.find((task) => task.name === nextTaskName)
    if (!nextTask) {
      throw new Error(`Task with name '${nextTaskName}' not found`)
    }
    const nextInput = currentTask.type === 'activity' ? output : currentInput
    makeTransition({ transitionName, nextTask, nextInput })
  }

  const failFn = (error: unknown) => {
    log('fail', error)
    if (currentTask.type === 'choice' || !currentTask.catch) {
      isEnd = true
      throw new Error(`No catch task found for error: ${error}`)
    }

    const matchingCatch = Object.entries(currentTask.catch).find(
      ([catchPattern]) => matchWithWildcards(catchPattern, `${error}`)
    )
    const catchTask = matchingCatch && matchingCatch[1]
    if (!catchTask) {
      log('No matching catch')
      throw new Error(`No matching catch for error: ${error}`)
    }
    const transitionName = matchingCatch[0]

    if (catchTask.then === null) {
      endTransition(error)
      return
    }

    const nextTask = tasks.find((a) => a.name === catchTask.then)
    if (!nextTask) {
      throw new Error(`Task with name '${catchTask.then}' not found`)
    }

    const nextInput: CatchInput<(typeof matchingCatch)[0]> = {
      key: matchingCatch[0],
      error,
    }

    makeTransition({ transitionName, nextTask, nextInput })
  }

  makeTransition({
    transitionName: '(start)',
    nextTask: startTask,
    nextInput: initialInput,
  })
  while (currentTask && !isEnd) {
    log('currentTask:', currentTask)

    await currentTask.fn(currentInput, context).then(successFn).catch(failFn)
  }

  log('trace:', JSON.stringify(transitions))
  return { success: true, transitions, output: currentInput, context }
}
