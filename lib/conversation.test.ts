import { describe, it, expect } from 'vitest'
import { normalizeParticipants, sameParticipants } from './conversation'

describe('normalizeParticipants', () => {
  it('trims, dedupes, drops empties, and sorts', () => {
    expect(normalizeParticipants([' b ', 'a', 'b', ''])).toEqual(['a', 'b'])
  })
  it('is order-independent', () => {
    expect(normalizeParticipants(['x', 'y'])).toEqual(normalizeParticipants(['y', 'x']))
  })
  it('handles an empty list', () => {
    expect(normalizeParticipants([])).toEqual([])
  })
})

describe('sameParticipants', () => {
  it('matches the same set regardless of order or duplicates', () => {
    expect(sameParticipants(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(sameParticipants(['a', 'a', 'b'], ['b', 'a'])).toBe(true)
  })
  it('rejects different sets', () => {
    expect(sameParticipants(['a', 'b'], ['a', 'c'])).toBe(false)
    expect(sameParticipants(['a'], ['a', 'b'])).toBe(false)
  })
})
