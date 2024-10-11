import { describe, expect, test } from 'bun:test'

import type { TaskDefinitions } from '../types'
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

    expect(result).toBe(`flowchart TD
    Start((start))-->
    activity1-->|then|activity2
    activity2-->|then|activity3
    activity3-->End((end))`)
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

    expect(result).toBe(`flowchart TD
    Start((start))-->
    activity1-->|then|activity2
    activity1-->|catch timeout|timeout_handler
    activity2-->|then|activity3
    activity2-->|catch timeout|timeout_handler
    activity3-->End((end))
    timeout_handler-->End((end))`)
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

    expect(result).toBe(`flowchart TD
    Start((start))-->
    choice_task{choice task}-->|choice1|activity1
    choice_task{choice task}-->|choice2|activity2
    activity1-->|then|activity2
    activity1-->|catch timeout|timeout_handler
    activity2-->|then|activity3
    activity2-->|catch timeout|timeout_handler
    activity3-->End((end))
    timeout_handler-->End((end))`)
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
})
