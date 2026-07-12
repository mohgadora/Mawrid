/**
 * lib/discounts.ts — pure discount / cashback / bonus math.
 *
 * All money reasoning happens in integer cents via lib/money.ts. These functions
 * are pure (no DB, no I/O) so they are exhaustively unit-tested — they are the
 * most dangerous code in the platform (they decide how much money moves).
 */
import { toCents, fromCents } from './money'

export type ValueType = 'percent' | 'fixed'

/**
 * Computes a percent-or-fixed amount off a base, in cents.
 * - percent → round(base * value / 100)
 * - fixed   → the fixed value converted to cents
 * Optionally capped (maxCents) and/or clamped so it never exceeds the base.
 */
export function computeValueCents(
  type: ValueType,
  value: number,
  baseCents: number,
  opts: { maxCents?: number | null; clampToBase?: boolean } = {},
): number {
  if (!Number.isFinite(value) || value <= 0 || baseCents <= 0) return 0
  let cents = type === 'percent' ? Math.round((baseCents * value) / 100) : toCents(value)
  const max = opts.maxCents
  if (max != null && max > 0) cents = Math.min(cents, max)
  cents = Math.max(0, cents)
  if (opts.clampToBase) cents = Math.min(cents, baseCents)
  return cents
}

/** Coupon discount in USD. Free-shipping coupons return 0 with freeShipping=true. */
export function couponDiscountUsd(
  type: 'percent' | 'fixed' | 'free_shipping',
  value: number,
  subtotalUsd: number,
  maxDiscountUsd?: number | null,
): { discountUsd: number; freeShipping: boolean } {
  if (type === 'free_shipping') return { discountUsd: 0, freeShipping: true }
  const cents = computeValueCents(type, value, toCents(subtotalUsd), {
    maxCents: maxDiscountUsd != null ? toCents(maxDiscountUsd) : null,
    clampToBase: true,
  })
  return { discountUsd: fromCents(cents), freeShipping: false }
}

/** Cashback in USD for an order total (never exceeds the total). */
export function cashbackUsd(
  type: ValueType,
  value: number,
  orderTotalUsd: number,
  maxCashbackUsd?: number | null,
): number {
  const cents = computeValueCents(type, value, toCents(orderTotalUsd), {
    maxCents: maxCashbackUsd != null ? toCents(maxCashbackUsd) : null,
    clampToBase: true,
  })
  return fromCents(cents)
}

/** Sale price after a percent/fixed discount (never below zero). */
export function salePriceUsd(
  baseUsd: number,
  type: ValueType,
  value: number,
  maxDiscountUsd?: number | null,
): number {
  const baseCents = toCents(baseUsd)
  const discountCents = computeValueCents(type, value, baseCents, {
    maxCents: maxDiscountUsd != null ? toCents(maxDiscountUsd) : null,
    clampToBase: true,
  })
  return fromCents(baseCents - discountCents)
}

/** Wallet top-up bonus in USD (capped, but not clamped to the top-up amount). */
export function topupBonusUsd(
  type: ValueType,
  value: number,
  topupUsd: number,
  maxBonusUsd?: number | null,
): number {
  const cents = computeValueCents(type, value, toCents(topupUsd), {
    maxCents: maxBonusUsd != null ? toCents(maxBonusUsd) : null,
    clampToBase: false,
  })
  return fromCents(cents)
}
