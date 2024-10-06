import type { ActivityDefinitions } from './types'
import { matchWithWildcards } from './catch-matcher'
import { log } from './logger'

/**
 * Run the workflow with an initial input
 */
export const run = async <InitialInput>(
  activities: ActivityDefinitions,
  initialInput: InitialInput
): Promise<void> => {
  const startActivity = Object.values(activities).find(
    (activity) => activity.start
  )
  if (!startActivity) throw new Error('No start activity found')
  log('startActivity', startActivity)

  let currentActivity = startActivity
  let currentInput: unknown = initialInput
  let isEnd = false
  let isFail = false

  const successFn = (output: unknown) => {
    if (isFail) return
    log('success', output)
    isEnd = currentActivity.then === null
    if (!currentActivity.then) {
      isEnd = true
      return
    }

    const nextActivity = activities.find((a) => a.name === currentActivity.then)
    if (!nextActivity) {
      throw new Error(`Activity with name '${currentActivity.then}' not found`)
    }
    currentActivity = nextActivity
    currentInput = output
  }

  const failFn = (error: unknown) => {
    log('fail', error)
    isFail = true
    if (!currentActivity.catch) {
      isEnd = true
      if (error instanceof Error) throw error
      throw new Error(`No catch activity found for error: ${error}`)
    }

    const matchingCatch = Object.entries(currentActivity.catch).find(
      ([catchPattern]) => matchWithWildcards(catchPattern, `${error}`)
    )
    const catchActivity = matchingCatch && matchingCatch[1]
    if (!catchActivity) {
      log('No matching catch')
      if (error instanceof Error) throw error
      throw new Error(`No matching catch for error: ${error}`)
    }
    if (catchActivity.then === null) {
      isEnd = true
      return
    }

    const nextActivity = activities.find((a) => a.name === catchActivity.then)
    if (!nextActivity) {
      throw new Error(`Activity with name '${catchActivity.then}' not found`)
    }
    currentActivity = nextActivity
    currentInput = error
  }

  while (currentActivity && !isEnd) {
    log('currentActivity:', currentActivity)
    isFail = false

    const output = await currentActivity
      .fn(currentInput, {
        fail: failFn,
      })
      .catch((error) => {
        log('Error caught in activity:', error)
        failFn(error)
      })

    successFn(output)
  }
}
