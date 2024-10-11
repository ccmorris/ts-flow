import { describe, expect, mock, test } from 'bun:test'

import { Choice } from '../Choice'
import { Activity } from '../Activity'

describe('Choice class', () => {
  test('should create a choice', () => {
    const choice = new Choice('id', async () => {})

    expect(choice.name).toBe('id')
    expect(choice.fn).toBeInstanceOf(Function)
  })

  test('should chain choices', () => {
    const activity1 = new Activity('activity1', async (_: 'in') => {})
    const activity2 = new Activity('activity2', async (_: 'in') => {})
    const choice = new Choice('id', async (_: 'in') => {})
      .choice('decision1', activity1)
      .choice('decision2', activity2)

    expect(choice.name).toBe('id')
    expect(choice.fn).toBeInstanceOf(Function)
    expect(choice.choices).toEqual({
      decision1: activity1,
      decision2: activity2,
    })
  })

  test('should convert to task definitions', () => {
    const activity1 = new Activity('activity1', async () => {})
    const activity2 = new Activity('activity2', async () => {})
    const choice = new Choice('id', async () => {})
      .choice('decision1', activity1)
      .choice('decision2', activity2)

    const taskDefinitions = choice.toTaskDefinitions()

    expect(taskDefinitions).toMatchSnapshot()
  })

  test('should run the choices based on the output of the choice function', async () => {
    const activity1 = new Activity('activity1', mock().mockResolvedValue(null))
    const activity2 = new Activity('activity2', mock().mockResolvedValue(null))
    const choice = new Choice('id', mock().mockResolvedValue('decision1'))
      .choice('decision1', activity1)
      .choice('decision2', activity2)

    await choice.run('initial input')

    expect(choice.fn).toHaveBeenCalledTimes(1)
    expect(choice.fn).toHaveBeenCalledWith('initial input', expect.any(Object))
    expect(activity1.fn).toHaveBeenCalled()
    expect(activity1.fn).toHaveBeenCalledWith(
      'initial input',
      expect.any(Object)
    )
    expect(activity2.fn).not.toHaveBeenCalled()
  })
})
