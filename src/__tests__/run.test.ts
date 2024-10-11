import { describe, expect, mock, test } from 'bun:test'
import type { ActivityContext, TaskDefinitions } from '../types'
import { run } from '../run'
import { log } from '../logger'

describe('run', () => {
  test('should run the tasks', async () => {
    const activityFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn, input:', input)
        return 'startActivityFn'
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: activityFn,
        then: null,
      },
    ]
    const input = 'input'

    await run(tasks, input)

    expect(activityFn).toHaveBeenCalledTimes(1)
    expect(activityFn).toHaveBeenCalledWith('input', expect.any(Object))
  })

  test('runs with two activities', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        return 'output from start activity'
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: 'end',
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await run(tasks, input)

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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { timeout: { then: 'end' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await run(tasks, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith(
      { key: 'timeout', error: 'timeout' },
      expect.any(Object)
    )
  })

  test('catches errors and sends to the catch route', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw new Error('Timeout')
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { 'Error: Timeout': { then: 'end' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await run(tasks, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith(
      {
        key: 'Error: Timeout',
        error: expect.objectContaining({ name: 'Error', message: 'Timeout' }),
      },
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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { 'Error: Timeout': { then: 'doesnotexist' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError(
      "Task with name 'doesnotexist' not found"
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws an error when the next activity does not exist', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        return 'output from start activity'
      }
    )
    const endFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: 'doesnotexist',
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError(
      "Task with name 'doesnotexist' not found"
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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { 'Error: Not Found': { then: 'end' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError('Timeout')

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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { 'Error: Not Found': { then: 'end' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError('Timeout')

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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
        catch: { Timeout: { then: 'end' } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError(
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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: null,
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await expect(run(tasks, input)).rejects.toThrowError(
      'No catch task found for error: Not Found'
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
      async (input: unknown, _context: ActivityContext) => {
        log('endActivityFn', input)
      }
    )
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'start',
        fn: startFn,
        then: 'end',
        catch: { 'Not Found': { then: null } },
      },
      {
        type: 'activity',
        name: 'end',
        fn: endFn,
        then: null,
      },
    ]
    const input = 'input'

    await run(tasks, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(0)
  })

  test('routes to a choice depending on the input', async () => {
    const choiceFn = mock().mockImplementation(async (input) => {
      log('choiceFn', input)
      return 'choice1'
    })
    const activityFn = mock().mockImplementation(async (input) => {
      log('endActivityFn', input)
    })
    const tasks: TaskDefinitions = [
      {
        type: 'choice',
        name: 'choice',

        fn: choiceFn,
        choices: {
          choice1: 'end',
          other: null,
        },
      },
      {
        type: 'activity',
        name: 'end',
        fn: activityFn,
        then: null,
      },
    ]

    await run(tasks, 'input')

    expect(choiceFn).toHaveBeenCalledTimes(1)
    expect(choiceFn).toHaveBeenCalledWith('input', expect.any(Object))
    expect(activityFn).toHaveBeenCalledTimes(1)
    expect(activityFn).toHaveBeenCalledWith('input', expect.any(Object))
  })
})
