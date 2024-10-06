import { describe, expect, mock, test } from 'bun:test'
import type { ActivityContext, ActivityDefinitions } from '../types'
import { run } from '../run'
import { log } from '../logger'

describe('run', () => {
  test('should run the activities', async () => {
    const activityFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn, input:', input)
        context.success('startActivityFn')
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: activityFn,
        then: null,
      },
    }
    const input = 'input'

    await run(activities, input)

    expect(activityFn).toHaveBeenCalledTimes(1)
    expect(activityFn).toHaveBeenCalledWith('input', expect.any(Object))
  })

  test('runs with two activities', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.success('output from start activity')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: 'end',
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await run(activities, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith(
      'output from start activity',
      expect.any(Object)
    )
  })

  test('matches a fail error and sends to the catch route', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.fail('timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { timeout: { then: 'end' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await run(activities, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith('timeout', expect.any(Object))
  })

  test('catches errors and sends to the catch route', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw new Error('Timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { 'Error: Timeout': { then: 'end' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await run(activities, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Error', message: 'Timeout' }),
      expect.any(Object)
    )
  })

  test('throws an error when the catch activity does not exist', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw new Error('Timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { 'Error: Timeout': { then: 'doesnotexist' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError(
      "Activity with name 'doesnotexist' not found"
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws an error when the next activity does not exist', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.success('output from start activity')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: 'doesnotexist',
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError(
      "Activity with name 'doesnotexist' not found"
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('rethrows an error when it does not match any catch', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw new Error('Timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { 'Error: Not Found': { then: 'end' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError('Timeout')

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws a new error when the fail message is string no catch exists', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.fail('Timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { 'Error: Not Found': { then: 'end' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError('Timeout')

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws a new error when a fail message does not match any catch', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.fail('Not Found')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
        catch: { Timeout: { then: 'end' } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError(
      'No matching catch for error: Not Found'
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws a new error when a fail message has no catch', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.fail('Not Found')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: null,
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await expect(run(activities, input)).rejects.toThrowError(
      'No catch activity found for error: Not Found'
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('ends when the catch goes to end', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('startActivityFn', input)
        context.fail('Not Found')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, context: ActivityContext) => {
        log('endActivityFn', input)
        context.success(null)
      }
    )
    const activities: ActivityDefinitions = {
      start: {
        start: true,
        fn: startFn,
        then: 'end',
        catch: { 'Not Found': { then: null } },
      },
      end: {
        fn: endFn,
        then: null,
      },
    }
    const input = 'input'

    await run(activities, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(0)
  })
})
