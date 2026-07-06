import { describe, it, expect } from 'vitest'
import { buildReferralCode } from './referral-code'

describe('buildReferralCode', () => {
  it('takes an 8-char uppercase prefix from the user id + suffix', () => {
    expect(buildReferralCode('abcdefghij', 'wxyz')).toBe('ABCDEFGHWXYZ')
  })
  it('replaces non-alphanumeric prefix chars with X', () => {
    expect(buildReferralCode('ab-cd_ef!', 'q1')).toBe('ABXCDXEFQ1')
  })
  it('uppercases the suffix', () => {
    expect(buildReferralCode('user1234', 'ab')).toBe('USER1234AB')
  })
  it('handles short ids', () => {
    expect(buildReferralCode('ab', 'cd')).toBe('ABCD')
  })
})
