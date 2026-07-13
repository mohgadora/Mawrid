import { describe, it, expect } from 'vitest'
import { isWithinWindow } from './time-window'

const now = new Date('2026-06-15T12:00:00Z')
const past = new Date('2026-01-01T00:00:00Z')
const future = new Date('2026-12-31T00:00:00Z')

describe('isWithinWindow', () => {
  it('is open when both bounds are null', () => {
    expect(isWithinWindow(null, null, now)).toBe(true)
  })
  it('is open within the window', () => {
    expect(isWithinWindow(past, future, now)).toBe(true)
  })
  it('is closed before it starts', () => {
    expect(isWithinWindow(future, null, now)).toBe(false)
  })
  it('is closed after it expires', () => {
    expect(isWithinWindow(null, past, now)).toBe(false)
  })
  it('treats a null start as already started and null expiry as never-ending', () => {
    expect(isWithinWindow(null, future, now)).toBe(true)
    expect(isWithinWindow(past, null, now)).toBe(true)
  })
  it('accepts ISO date strings', () => {
    expect(isWithinWindow(past.toISOString(), future.toISOString(), now)).toBe(true)
  })
  it('ignores unparseable dates rather than closing the window', () => {
    expect(isWithinWindow('not-a-date', null, now)).toBe(true)
  })
})
