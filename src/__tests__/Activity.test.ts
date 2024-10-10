import { describe, expect, mock, test } from 'bun:test'

import { Activity } from '../Activity'

describe('Activity class', () => {
  test('should create an activity', () => {
    const activity = new Activity('activity', async () => {})

    expect(activity.name).toBe('activity')
    expect(activity.start).toBe(true)
    expect(activity.fn).toBeInstanceOf(Function)
  })

  test('should chain activities', () => {
    const activity1 = new Activity('activity1', async () => {})
    const activity2 = new Activity('activity2', async () => {})
    const activity3 = new Activity('activity3', async () => {})

    activity1.then(activity2).then(activity3)

    expect(activity1.next).toBe(activity2)
    expect(activity2.next).toBe(activity3)
  })

  test('should chain activities with catch', () => {
    const activity1 = new Activity('activity1', async () => {})
    const activity2 = new Activity('activity2', async () => {})
    const activity3 = new Activity('activity3', async () => {})

    activity1.then(activity2).catch('error', activity3)

    expect(activity1.next).toBe(activity2)
    expect(activity2.catchConfig).toEqual({ error: { then: activity3 } })
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
        start: true,
        fn: activity1.fn,
        then: 'activity2',
      },
      {
        type: 'activity',
        name: 'activity2',
        start: undefined,
        fn: activity2.fn,
        then: null,
        catch: { error: { then: 'activity3' } },
      },
      {
        type: 'activity',
        name: 'activity3',
        start: undefined,
        fn: activity3.fn,
        then: null,
      },
    ])
  })

  test('should run activities', async () => {
    const fn1 = mock().mockResolvedValue('output from activity1')
    const fn2 = mock().mockResolvedValue('output from activity2')
    const fn3 = mock().mockResolvedValue('output from activity3')
    const activity1 = new Activity('activity1', fn1)
    const activity2 = new Activity('activity2', fn2)
    const activity3 = new Activity('activity3', fn3)

    activity1.then(activity2).catch('error', activity3)

    await activity1.run('initial input')

    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn1).toHaveBeenCalledWith('initial input', expect.any(Object))
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledWith(
      'output from activity1',
      expect.any(Object)
    )
    expect(fn3).toHaveBeenCalledTimes(0)
  })
})
