import { describe, expect, test } from 'bun:test'

import type { TaskDefinitions, Transition, WorkflowResult } from '../types'
import { toMermaid, toMermaidLiveEdit, toMermaidPngUrl } from '../mermaid'

describe('toMermaid', () => {
  test('should generate a mermaid diagram', () => {
    const activities: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
    ]

    const result = toMermaid(activities)

    expect(result).toMatchSnapshot()
  })

  test('should generate a mermaid diagram with catches', () => {
    const activities: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const result = toMermaid(activities)

    expect(result).toMatchSnapshot()
  })

  test('should generate a mermaid diagram with catches and choices', () => {
    const activities: TaskDefinitions = [
      {
        type: 'choice',
        name: 'choice task',
        fn: async () => {},
        choices: { choice1: 'activity1', choice2: 'activity2' },
      },
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const result = toMermaid(activities)

    expect(result).toMatchSnapshot()
  })

  test('should style the traced tasks green', () => {
    const activities: TaskDefinitions = [
      {
        type: 'choice',
        name: 'choice task',
        fn: async () => {},
        choices: { choice1: 'activity1', choice2: 'activity2' },
      },
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]
    const transitions: Transition[] = [
      {
        transitionName: '(start)',
        from: null,
        to: activities[0],
        nextInput: 'input',
      },
      {
        transitionName: 'choice1',
        from: activities[0],
        to: activities[1],
        nextInput: 'input',
      },
      {
        transitionName: 'then',
        from: activities[1],
        to: activities[2],
        nextInput: 'input',
      },
      {
        transitionName: 'timeout',
        from: activities[2],
        to: activities[4],
        nextInput: 'input',
      },
      {
        transitionName: '(end)',
        from: activities[4],
        to: null,
        nextInput: null,
      },
    ]
    const workflowResult: WorkflowResult = {
      transitions,
      success: true,
      output: undefined,
      context: {},
    }

    const result = toMermaid(activities, workflowResult)

    expect(result).toMatchSnapshot()
  })
})

describe('toMermaidLiveEdit', () => {
  test('should generate a URL to edit a mermaid diagram', () => {
    const activities: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const liveEditUrl = toMermaidLiveEdit(activities)

    expect(liveEditUrl).toMatchSnapshot()
  })
})

describe('toMermaidPngUrl', () => {
  test('should generate a URL to a mermaid diagram PNG', () => {
    const activities: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const pngUrl = toMermaidPngUrl(activities)

    expect(pngUrl).toMatchSnapshot()
  })

  test('should generate a URL to a traced mermaid diagram PNG', () => {
    const activities: TaskDefinitions = [
      {
        type: 'activity',
        name: 'activity1',
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        type: 'activity',
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      { type: 'activity', name: 'activity3', fn: async () => {}, then: null },
      {
        type: 'activity',
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]
    const workflowResult: WorkflowResult = {
      success: true,
      output: undefined,
      context: {},
      transitions: [
        {
          transitionName: '(start)',
          from: null,
          to: activities[0],
          nextInput: 'input',
        },
        {
          transitionName: 'then',
          from: activities[0],
          to: activities[1],
          nextInput: 'input',
        },
        {
          transitionName: 'timeout',
          from: activities[1],
          to: activities[3],
          nextInput: 'input',
        },
        {
          transitionName: '(end)',
          from: activities[3],
          to: null,
          nextInput: null,
        },
      ],
    }

    const pngUrl = toMermaidPngUrl(activities, workflowResult)

    expect(pngUrl).toMatchSnapshot()
  })
})
