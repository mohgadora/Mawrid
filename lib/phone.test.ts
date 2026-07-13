import { describe, it, expect } from 'vitest'
import { normalizePhone, isValidOtpCode } from './phone'

describe('normalizePhone', () => {
  it('keeps a valid international number and strips spaces/dashes', () => {
    expect(normalizePhone('+966501234567')).toBe('+966501234567')
    expect(normalizePhone('+966 50 123 4567')).toBe('+966501234567')
    expect(normalizePhone('966-50-1234567')).toBe('+966501234567')
  })

  it('prefixes a + when missing', () => {
    expect(normalizePhone('966501234567')).toBe('+966501234567')
  })

  it('rejects too-short, too-long, or non-numeric input', () => {
    expect(() => normalizePhone('123')).toThrowError(/غير صالح/)
    expect(() => normalizePhone('')).toThrowError(/غير صالح/)
    expect(() => normalizePhone('+9665012345671234567')).toThrowError(/غير صالح/)
    expect(() => normalizePhone('abc12345')).toThrowError(/غير صالح/)
  })
})

describe('isValidOtpCode', () => {
  it('accepts exactly 6 digits', () => {
    expect(isValidOtpCode('000000')).toBe(true)
    expect(isValidOtpCode('123456')).toBe(true)
  })
  it('rejects anything else', () => {
    expect(isValidOtpCode('12345')).toBe(false)
    expect(isValidOtpCode('1234567')).toBe(false)
    expect(isValidOtpCode('12ab56')).toBe(false)
    expect(isValidOtpCode('')).toBe(false)
  })
})
