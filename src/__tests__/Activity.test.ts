import { describe, expect, mock, test } from 'bun:test'

import { Activity } from '../Activity'
import { CatchInput } from '../types'
import { Workflow } from '../Workflow'

describe('Activity class', () => {
  test('should create an activity', () => {
    const activity = new Activity('activity', async () => {})

    expect(activity.name).toBe('activity')
    expect(activity.fn).toBeInstanceOf(Function)
  })

  test('should chain activities', () => {
    const activity1 = new Activity('activity1', async (_: '1') => '2' as const)
    const activity2 = new Activity('activity2', async (_: '2') => '3' as const)
    const activity3 = new Activity('activity3', async (_: '3') => '4' as const)

    activity1.then(activity2).then(activity3)

    expect(activity1.next?.name).toBe(activity2.name)
    expect(activity2.next?.name).toBe(activity3.name)
  })

  test('should chain activities with catch', () => {
    const activity1 = new Activity('activity1', async (_: '1') => '2' as const)
    const activity2 = new Activity('activity2', async (_: '2') => '3' as const)
    const activity3 = new Activity(
      'activity3',
      async (_: CatchInput<'error'>) => '4' as const
    )

    activity1.then(activity2).catch('error', activity3)

    expect(activity1.next?.name).toBe(activity2.name)
    expect(activity2.catchConfig).toEqual({ error: { then: activity3 as any } })
  })

  test('should convert to activity definitions', () => {
    const activity1 = new Activity('activity1', async () => {})
    const activity2 = new Activity('activity2', async () => {})
    const activity3 = new Activity('activity3', async () => {})

    activity1.then(activity2).catch('error', activity3)

    const taskDefinitions = activity1.toTaskDefinitions()

    expect(taskDefinitions).toEqual([
      {
        type: 'activity',
        name: 'activity1',
        fn: activity1.fn,
        then: 'activity2',
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: activity2.fn,
        then: null,
        catch: { error: { then: 'activity3' } },
      },
      {
        type: 'activity',
        name: 'activity3',
        fn: activity3.fn,
        then: null,
      },
    ])
  })

  test('should run activities', async () => {
    const activity1 = new Activity(
      'activity1',
      mock().mockResolvedValue('output from activity1')
    )
    const activity2 = new Activity(
      'activity2',
      mock().mockRejectedValue(new Error('Timeout'))
    )
    const activity3 = new Activity(
      'activity3',
      mock().mockResolvedValue('output from activity3')
    )

    activity1.then(activity2).catch('Timeout', activity3)

    const result = await new Workflow({ startTask: activity1 }).run(
      'initial input'
    )

    expect(activity1.fn).toHaveBeenCalledTimes(1)
    expect(activity1.fn).toHaveBeenCalledWith(
      'initial input',
      expect.any(Object)
    )
    expect(activity2.fn).toHaveBeenCalledTimes(1)
    expect(activity2.fn).toHaveBeenCalledWith(
      'output from activity1',
      expect.any(Object)
    )
    expect(activity3.fn).toHaveBeenCalledTimes(1)
    expect(activity3.fn).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Timeout', error: expect.any(Error) }),
      expect.any(Object)
    )

    expect(result).toMatchSnapshot()
  })
})
