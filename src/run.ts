import type {
  CatchInput,
  TaskDefinition,
  TaskDefinitions,
  Transition,
  WorkflowResult,
} from './types'
import { matchWithWildcards } from './catch-matcher'
import { log } from './logger'
import { WorkflowError } from './errors'

/**
 * Run the workflow with an initial input and initial context
 */
export const run = async <InitialInput>(
  tasks: TaskDefinitions,
  initialInput: InitialInput,
  initialContext: Record<string, unknown> = {}
): Promise<WorkflowResult> => {
  const startTask = Object.values(tasks)[0]
  if (!startTask) throw new Error('No start task found')
  log('startTask', startTask)

  let currentTask: TaskDefinition
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
    transitions.push({
      transitionName,
      nextInput,
      from: currentTask ?? null,
      to: nextTask ?? null,
    })
    if (nextTask) currentTask = nextTask
    currentInput = nextInput
  }
  const endTransition = (output?: unknown) => {
    makeTransition({ transitionName: '(end)', nextInput: output })
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

  const failFn = (e: unknown) => {
    const error = e instanceof Error ? e : new Error(`${e}`)
    log('fail', error)
    const workflowError = new WorkflowError(
      `Error thrown in workflow: ${error.message}`,
      error,
      { success: false, transitions, output: error, context },
      tasks
    )
    if (currentTask.type === 'choice' || !currentTask.catch) {
      isEnd = true
      throw workflowError
    }

    const matchingCatch = Object.entries(currentTask.catch).find(
      ([catchPattern]) =>
        matchWithWildcards(catchPattern, `${e}`) ||
        matchWithWildcards(catchPattern, error.message)
    )
    const catchTask = matchingCatch && matchingCatch[1]
    if (!catchTask) {
      log('No matching catch')
      throw workflowError
    }
    const transitionName = matchingCatch[0]

    if (catchTask.then === null) {
      endTransition(error)
      return
    }

    const nextTask = tasks.find((a) => a.name === catchTask.then)
    if (!nextTask) {
      const notFoundError = new Error(
        `Task with name '${catchTask.then}' not found`
      )
      throw new WorkflowError(
        `Task with name '${catchTask.then}' not found`,
        notFoundError,
        { success: false, transitions, output: notFoundError, context },
        tasks
      )
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
  currentTask = startTask
  while (currentTask && !isEnd) {
    log('currentTask:', currentTask.name)
    await currentTask.fn(currentInput, context).then(successFn).catch(failFn)
  }

  log('trace:', JSON.stringify(transitions))
  return { success: true, transitions, output: currentInput, context }
}
