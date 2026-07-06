import { describe, it, expect } from 'vitest'
import { computeValueCents, couponDiscountUsd, cashbackUsd, topupBonusUsd } from './discounts'

describe('computeValueCents', () => {
  it('computes a percentage of the base', () => {
    expect(computeValueCents('percent', 10, 10000)).toBe(1000) // 10% of $100
    expect(computeValueCents('percent', 15, 5000)).toBe(750)
  })
  it('rounds percentages to the nearest cent', () => {
    expect(computeValueCents('percent', 33, 100)).toBe(33) // 33% of $1 = 33c
    expect(computeValueCents('percent', 33, 101)).toBe(33) // 33.33c → 33
  })
  it('uses the fixed value directly', () => {
    expect(computeValueCents('fixed', 5, 10000)).toBe(500)
  })
  it('applies a cap', () => {
    expect(computeValueCents('percent', 50, 10000, { maxCents: 2000 })).toBe(2000) // 50% capped at $20
    expect(computeValueCents('percent', 5, 10000, { maxCents: 2000 })).toBe(500) // under cap → unchanged
  })
  it('clamps to the base when asked', () => {
    expect(computeValueCents('fixed', 200, 5000, { clampToBase: true })).toBe(5000) // $200 off a $50 base → $50
    expect(computeValueCents('fixed', 200, 5000, { clampToBase: false })).toBe(20000)
  })
  it('returns 0 for invalid or empty inputs', () => {
    expect(computeValueCents('percent', 0, 10000)).toBe(0)
    expect(computeValueCents('percent', -5, 10000)).toBe(0)
    expect(computeValueCents('percent', 10, 0)).toBe(0)
    expect(computeValueCents('percent', NaN, 10000)).toBe(0)
  })
})

describe('couponDiscountUsd', () => {
  it('percentage discount', () => {
    expect(couponDiscountUsd('percent', 10, 250)).toEqual({ discountUsd: 25, freeShipping: false })
  })
  it('percentage with a max-discount cap', () => {
    expect(couponDiscountUsd('percent', 50, 1000, 100)).toEqual({ discountUsd: 100, freeShipping: false })
  })
  it('fixed discount never exceeds the subtotal', () => {
    expect(couponDiscountUsd('fixed', 50, 30)).toEqual({ discountUsd: 30, freeShipping: false })
    expect(couponDiscountUsd('fixed', 50, 200)).toEqual({ discountUsd: 50, freeShipping: false })
  })
  it('free shipping yields no subtotal discount', () => {
    expect(couponDiscountUsd('free_shipping', 0, 200)).toEqual({ discountUsd: 0, freeShipping: true })
  })
})

describe('cashbackUsd', () => {
  it('percentage cashback', () => {
    expect(cashbackUsd('percent', 5, 200)).toBe(10)
  })
  it('respects the max cashback cap', () => {
    expect(cashbackUsd('percent', 10, 1000, 25)).toBe(25)
  })
  it('never exceeds the order total', () => {
    expect(cashbackUsd('fixed', 500, 40)).toBe(40)
  })
})

describe('topupBonusUsd', () => {
  it('percentage bonus on a top-up', () => {
    expect(topupBonusUsd('percent', 10, 100)).toBe(10)
  })
  it('fixed bonus is not clamped to the top-up amount', () => {
    // a $5 bonus on a $3 top-up is allowed (bonus is separate money)
    expect(topupBonusUsd('fixed', 5, 3)).toBe(5)
  })
  it('respects the max bonus cap', () => {
    expect(topupBonusUsd('percent', 20, 1000, 50)).toBe(50)
  })
})
