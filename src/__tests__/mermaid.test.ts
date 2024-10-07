import { describe, expect, test } from 'bun:test'

import type { ActivityDefinitions } from '../types'
import { toMermaid, toMermaidLiveEdit, toMermaidPngUrl } from '../mermaid'

describe('toMermaid', () => {
  test('should generate a mermaid diagram', () => {
    const activities: ActivityDefinitions = [
      {
        name: 'activity1',
        start: true,
        fn: async () => {},
        then: 'activity2',
      },
      {
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
      },
      {
        name: 'activity3',
        fn: async () => {},
        then: null,
      },
    ]

    const result = toMermaid(activities)

    expect(result).toBe(`flowchart TD
    Start((start))-->
    activity1-->|then|activity2
    activity2-->|then|activity3
    activity3-->End((end))`)
  })

  test('should generate a mermaid diagram with catches', () => {
    const activities: ActivityDefinitions = [
      {
        name: 'activity1',
        start: true,
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity3',
        fn: async () => {},
        then: null,
      },
      {
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const result = toMermaid(activities)

    expect(result).toBe(`flowchart TD
    Start((start))-->
    activity1-->|then|activity2-->|catch timeout|timeout_handler
    activity2-->|then|activity3-->|catch timeout|timeout_handler
    activity3-->End((end))
    timeout_handler-->End((end))`)
  })
})

describe('toMermaidLiveEdit', () => {
  test('should generate a URL to edit a mermaid diagram', () => {
    const activities: ActivityDefinitions = [
      {
        name: 'activity1',
        start: true,
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity3',
        fn: async () => {},
        then: null,
      },
      {
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
    const activities: ActivityDefinitions = [
      {
        name: 'activity1',
        start: true,
        fn: async () => {},
        then: 'activity2',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity2',
        fn: async () => {},
        then: 'activity3',
        catch: { timeout: { then: 'timeout_handler' } },
      },
      {
        name: 'activity3',
        fn: async () => {},
        then: null,
      },
      {
        name: 'timeout_handler',
        fn: async () => {},
        then: null,
      },
    ]

    const pngUrl = toMermaidPngUrl(activities)

    expect(pngUrl).toMatchSnapshot()
  })
})
