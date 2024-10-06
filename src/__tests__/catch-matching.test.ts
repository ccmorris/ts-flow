import { describe, expect, test } from 'bun:test'
import { matchWithWildcards } from '../catch-matcher'

describe('matchWithWildcards', () => {
  test('should match exact string', () => {
    expect(matchWithWildcards('exact', 'exact')).toBe(true)
    expect(matchWithWildcards('exact', 'not exact')).toBe(false)
  })

  test('should match prefix', () => {
    expect(matchWithWildcards('pre*', 'prefix')).toBe(true)
    expect(matchWithWildcards('pre*', 'not prefix')).toBe(false)
  })

  test('should match suffix', () => {
    expect(matchWithWildcards('*fix', 'suffix')).toBe(true)
    expect(matchWithWildcards('*fix', 'suffix not matching')).toBe(false)
  })

  test('should match substring', () => {
    expect(matchWithWildcards('*sub*', 'substring')).toBe(true)
    expect(matchWithWildcards('*sub*', 'not in here')).toBe(false)
  })
})
