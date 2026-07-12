/**
 * lib/tier-pricing.ts — pure quantity-tier pricing (no DB, no I/O).
 *
 * Extracted so the price a customer actually pays can be unit-tested. The rule:
 * never trust a client price — derive it from the product's price_tier rows by
 * quantity, then apply the retail markup for non-wholesale roles.
 */
import { RETAIL_MARKUP } from '@/lib/config'
import { ValidationError } from '@/lib/errors'

export type Tier = { minQty: number; maxQty: number | null; price: string | number }

export const isWholesaleRole = (role: string): boolean => role === 'merchant'

/** Applies the retail markup for non-wholesale (guest/consumer) roles. */
export function applyRoleMarkup(wholesaleUsd: number, role: string): number {
  return isWholesaleRole(role) ? wholesaleUsd : wholesaleUsd * RETAIL_MARKUP
}

/** Picks the wholesale price (USD, pre-markup) for a given quantity. */
export function pickTierPriceUsd(tiers: Tier[], qty: number): number {
  if (!tiers.length) throw new ValidationError('لا يوجد سعر متاح لهذا المنتج')
  const minMoq = tiers.reduce((m, t) => Math.min(m, t.minQty), tiers[0].minQty)
  if (qty < minMoq) {
    throw new ValidationError(`الحد الأدنى للطلب ${minMoq} وحدة`)
  }
  const match =
    tiers
      .filter((t) => qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty))
      .sort((a, b) => b.minQty - a.minQty)[0] ??
    [...tiers].sort((a, b) => a.minQty - b.minQty)[0]
  return Number(match.price)
}
