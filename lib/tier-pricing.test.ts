import { describe, it, expect } from 'vitest'
import { pickTierPriceUsd, applyRoleMarkup, isWholesaleRole, type Tier } from './tier-pricing'
import { RETAIL_MARKUP } from './config'

const tiers: Tier[] = [
  { minQty: 1, maxQty: 9, price: '10' },
  { minQty: 10, maxQty: 49, price: '9' },
  { minQty: 50, maxQty: null, price: '8' },
]

describe('pickTierPriceUsd', () => {
  it('picks the tier matching the quantity', () => {
    expect(pickTierPriceUsd(tiers, 1)).toBe(10)
    expect(pickTierPriceUsd(tiers, 9)).toBe(10)
    expect(pickTierPriceUsd(tiers, 10)).toBe(9)
    expect(pickTierPriceUsd(tiers, 49)).toBe(9)
    expect(pickTierPriceUsd(tiers, 50)).toBe(8)
  })

  it('uses the open-ended top tier for very large quantities', () => {
    expect(pickTierPriceUsd(tiers, 5000)).toBe(8)
  })

  it('throws below the minimum order quantity', () => {
    const highMoq: Tier[] = [{ minQty: 12, maxQty: null, price: '5' }]
    expect(() => pickTierPriceUsd(highMoq, 5)).toThrowError(/الحد الأدنى/)
  })

  it('throws when there are no tiers', () => {
    expect(() => pickTierPriceUsd([], 1)).toThrowError(/سعر متاح/)
  })

  it('falls back to the lowest tier if no range matches (defensive)', () => {
    const gapped: Tier[] = [{ minQty: 1, maxQty: 5, price: '10' }] // qty 6 has no explicit match
    expect(pickTierPriceUsd(gapped, 6)).toBe(10)
  })
})

describe('applyRoleMarkup', () => {
  it('gives merchants the raw wholesale price', () => {
    expect(isWholesaleRole('merchant')).toBe(true)
    expect(applyRoleMarkup(10, 'merchant')).toBe(10)
  })

  it('marks up the price for consumers and guests', () => {
    expect(applyRoleMarkup(10, 'consumer')).toBe(10 * RETAIL_MARKUP)
    expect(applyRoleMarkup(10, 'guest')).toBe(10 * RETAIL_MARKUP)
  })
})
