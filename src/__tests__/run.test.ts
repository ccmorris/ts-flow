import { describe, expect, mock, test } from 'bun:test'
import type { ActivityContext, TaskDefinitions } from '../types'
import { run } from '../run'
import { log } from '../logger'
import { WorkflowError } from '../errors'

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

  test('should return a workflow result with transitions', async () => {
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

    const result = await run(tasks, input)

    expect(result.success).toBe(true)
    expect(result.transitions).toEqual([
      { transitionName: '(start)', from: null, to: tasks[0], nextInput: input },
      {
        transitionName: '(end)',
        from: tasks[0],
        to: null,
        nextInput: 'startActivityFn',
      },
    ])
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
        return 'output2'
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

    const result = await run(tasks, input)

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(endFn).toHaveBeenCalledWith(
      'output from start activity',
      expect.any(Object)
    )
    expect(result.success).toBe(true)
    expect(result.output).toBe('output2')
    expect(result.transitions).toEqual([
      { transitionName: '(start)', from: null, to: tasks[0], nextInput: input },
      {
        transitionName: 'then',
        from: tasks[0],
        to: tasks[1],
        nextInput: 'output from start activity',
      },
      {
        transitionName: '(end)',
        from: tasks[1],
        to: null,
        nextInput: 'output2',
      },
    ])
  })

  test('matches a fail error and sends to the catch route', async () => {
    const timeoutError = new Error('Timeout')
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw timeoutError
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
      { key: 'Error: Timeout', error: timeoutError },
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

    try {
      await run(tasks, input)
    } catch (e) {
      expect(e).toBeInstanceOf(WorkflowError)
      if (e instanceof WorkflowError) {
        expect(e.message).toBe("Task with name 'doesnotexist' not found")
        expect(e.workflowResult?.success).toBe(false)
        expect(e.workflowResult?.transitions).toEqual([
          {
            transitionName: '(start)',
            from: null,
            to: tasks[0],
            nextInput: input,
          },
        ])
      }
    }

    expect(startFn).toHaveBeenCalledTimes(1)
    expect.hasAssertions()
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

    await expect(run(tasks, input)).rejects.toThrow(
      new WorkflowError('Error thrown in workflow: Timeout')
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws a new error when the fail message is string no catch exists', async () => {
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
        catch: { 'Not Found': { then: 'end' } },
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
    const startFn = mock().mockRejectedValue(new Error('Not Found'))
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
      'Error thrown in workflow: Not Found'
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('throws a new error when a fail message has no catch', async () => {
    const startFn = mock().mockImplementation(
      async (input: unknown, _context: ActivityContext) => {
        log('startActivityFn', input)
        throw new Error('Not Found')
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
      'Error thrown in workflow: Not Found'
    )

    expect(startFn).toHaveBeenCalledTimes(1)
  })

  test('ends when the catch goes to end', async () => {
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
        then: 'end',
        catch: { 'Error: Timeout': { then: null } },
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

  test('context is shared between tasks', async () => {
    const activity1Fn = mock().mockImplementation(async (input, context) => {
      log('activity1Fn', { input, context })
      expect(context.shared).toBe('initial')
      context.shared = 'shared'
      return input
    })
    const activity2Fn = mock().mockImplementation(async (input, context) => {
      log('activity2Fn', { input, context })
      expect(context.shared).toBe('shared')
    })
    const tasks: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: activity1Fn,
        then: 'activity2',
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: activity2Fn,
        then: null,
      },
    ]

    const result = await run(tasks, 'input', { shared: 'initial' })

    expect(activity1Fn).toHaveBeenCalledTimes(1)
    expect(activity2Fn).toHaveBeenCalledTimes(1)
    expect(result.context).toEqual({ shared: 'shared' })
  })
})
