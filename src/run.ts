import type { CatchInput, TaskDefinitions } from './types'
import { matchWithWildcards } from './catch-matcher'
import { log } from './logger'

/**
 * Run the workflow with an initial input
 */
export const run = async <InitialInput>(
  tasks: TaskDefinitions,
  initialInput: InitialInput
): Promise<void> => {
  const startTask = Object.values(tasks)[0]
  if (!startTask) throw new Error('No start task found')
  log('startTask', startTask)

  let currentTask = startTask
  let currentInput: unknown = initialInput
  let isEnd = false
  let isFail = false

  const successFn = (output: unknown) => {
    if (isFail) return
    log('success', output)
    if (currentTask.type === 'activity' && currentTask.then === null) {
      isEnd = true
      return
    }

    const nextTaskName =
      currentTask.type === 'activity'
        ? currentTask.then
        : currentTask.choices[`${output}`]
    const nextTask = tasks.find((task) => task.name === nextTaskName)
    if (!nextTask) {
      throw new Error(`Task with name '${nextTaskName}' not found`)
    }
    if (currentTask.type === 'activity') {
      currentInput = output
    }
    currentTask = nextTask
  }

  const failFn = (error: unknown) => {
    log('fail', error)
    isFail = true
    if (currentTask.type === 'choice' || !currentTask.catch) {
      isEnd = true
      if (error instanceof Error) throw error
      throw new Error(`No catch task found for error: ${error}`)
    }

    const matchingCatch = Object.entries(currentTask.catch).find(
      ([catchPattern]) => matchWithWildcards(catchPattern, `${error}`)
    )
    const catchTask = matchingCatch && matchingCatch[1]
    if (!catchTask) {
      log('No matching catch')
      if (error instanceof Error) throw error
      throw new Error(`No matching catch for error: ${error}`)
    }
    if (catchTask.then === null) {
      isEnd = true
      return
    }

    const nextActivity = tasks.find((a) => a.name === catchTask.then)
    if (!nextActivity) {
      throw new Error(`Task with name '${catchTask.then}' not found`)
    }

    const catchInput: CatchInput<(typeof matchingCatch)[0]> = {
      key: matchingCatch[0],
      error,
    }
    currentTask = nextActivity
    currentInput = catchInput
  }

  while (currentTask && !isEnd) {
    log('currentTask:', currentTask)
    isFail = false

    const output = await currentTask
      .fn(currentInput, {
        fail: failFn,
      })
      .catch((error) => {
        log('Error caught in task:', error)
        failFn(error)
      })

    successFn(output)
  }
}
