import { describe, it, expect } from 'vitest'
import { toCents, fromCents, lineTotalCents, sumCents, lineTotalUsd } from './money'

describe('money — toCents/fromCents', () => {
  it('converts USD to integer cents', () => {
    expect(toCents(1)).toBe(100)
    expect(toCents(0.1)).toBe(10)
    expect(toCents(19.99)).toBe(1999)
    expect(toCents(0)).toBe(0)
  })

  it('is exact for all 2-decimal currency inputs (the only inputs the system uses)', () => {
    expect(toCents(0.01)).toBe(1)
    expect(toCents(0.99)).toBe(99)
    expect(toCents(1234.56)).toBe(123456)
    expect(toCents(999999.99)).toBe(99999999)
  })

  it('is float-dependent for 3-decimal inputs — which is why the system only uses 2-decimal prices', () => {
    // 3-decimal inputs land unpredictably around the half-cent depending on their
    // IEEE-754 representation (2.675 → 268 here). Prices are stored as
    // numeric(12,2), so these values never reach toCents in practice.
    expect(toCents(2.675)).toBe(268)
  })

  it('round-trips through cents without drift', () => {
    for (const usd of [0, 0.1, 0.2, 0.3, 19.99, 500, 1000.55]) {
      expect(fromCents(toCents(usd))).toBeCloseTo(usd, 2)
    }
  })

  it('fromCents divides by 100', () => {
    expect(fromCents(100)).toBe(1)
    expect(fromCents(1999)).toBe(19.99)
    expect(fromCents(0)).toBe(0)
  })
})

describe('money — the 0.1 + 0.2 problem', () => {
  it('sums fractional prices exactly via cents', () => {
    // naive float: 0.1 + 0.2 === 0.30000000000000004
    const total = fromCents(sumCents([toCents(0.1), toCents(0.2)]))
    expect(total).toBe(0.3)
  })

  it('sums a realistic cart without penny errors', () => {
    const prices = [19.99, 19.99, 19.99, 5.01, 0.1, 0.2]
    const total = fromCents(sumCents(prices.map((p) => toCents(p))))
    expect(total).toBe(65.28)
  })
})

describe('money — lineTotalCents', () => {
  it('multiplies unit price by whole quantity in cents', () => {
    expect(lineTotalCents(19.99, 3)).toBe(5997)
    expect(lineTotalCents(0.1, 3)).toBe(30)
  })

  it('truncates fractional quantities and floors negatives to zero', () => {
    expect(lineTotalCents(10, 2.9)).toBe(2000) // qty truncated to 2
    expect(lineTotalCents(10, -5)).toBe(0)
    expect(lineTotalCents(10, 0)).toBe(0)
  })

  it('lineTotalUsd mirrors lineTotalCents as a USD number', () => {
    expect(lineTotalUsd(19.99, 3)).toBe(59.97)
    expect(lineTotalUsd(1.5, 3)).toBe(4.5)
  })
})

describe('money — sumCents', () => {
  it('sums an empty list to zero', () => {
    expect(sumCents([])).toBe(0)
  })
  it('handles negative (refund) amounts', () => {
    expect(sumCents([1000, -300, -200])).toBe(500)
  })
})
