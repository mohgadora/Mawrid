import type { Role } from '@/lib/config'
import { fromCents, toCents } from '@/lib/money'
import { delay } from './core'

/**
 * Coupon / voucher engine.
 *
 * Coupons are defined declaratively below and validated against the current
 * cart subtotal (USD) and the shopper's role. All discount math is routed
 * through `lib/money` (integer cents) so totals never drift.
 */

export type CouponKind = 'percent' | 'fixed' | 'freeShipping'

export type Coupon = {
  code: string
  kind: CouponKind
  /** percent => 0-100, fixed => USD off, freeShipping => ignored. */
  value: number
  minSubtotalUsd: number
  labelAr: string
  labelEn: string
  descAr: string
  descEn: string
  /** ISO date; coupon is invalid on/after this instant. */
  expiresAt: string
  /** Restrict to a single role (e.g. merchant-only bulk coupon). */
  roleRestrict?: Role
  /** Cap on the discount for percentage coupons, in USD. */
  maxDiscountUsd?: number
}

function inDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** The catalog of active coupons. In production this would come from an API. */
export const COUPONS: Coupon[] = [
  {
    code: 'WELCOME10',
    kind: 'percent',
    value: 10,
    minSubtotalUsd: 0,
    maxDiscountUsd: 40,
    labelAr: 'خصم ترحيبي 10%',
    labelEn: '10% welcome discount',
    descAr: 'خصم 10% على أول طلب (حتى 40$)',
    descEn: '10% off your first order (up to $40)',
    expiresAt: inDays(30),
  },
  {
    code: 'BULK50',
    kind: 'fixed',
    value: 50,
    minSubtotalUsd: 600,
    labelAr: 'خصم 50$ للطلبات الكبيرة',
    labelEn: '$50 off large orders',
    descAr: 'خصم 50$ عند الشراء بـ 600$ أو أكثر',
    descEn: '$50 off when you spend $600 or more',
    expiresAt: inDays(14),
    roleRestrict: 'merchant',
  },
  {
    code: 'FREESHIP',
    kind: 'freeShipping',
    value: 0,
    minSubtotalUsd: 200,
    labelAr: 'شحن مجاني',
    labelEn: 'Free shipping',
    descAr: 'شحن مجاني للطلبات فوق 200$',
    descEn: 'Free shipping on orders over $200',
    expiresAt: inDays(21),
  },
]

export type CouponError = 'invalid' | 'expired' | 'minNotMet' | 'merchantOnly'

export type CouponValidation =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: CouponError; coupon?: Coupon }

/** Find a coupon by code (case-insensitive), ignoring validity. */
export function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase()
  return COUPONS.find((c) => c.code === normalized)
}

/** Validate a coupon code against the current subtotal and role. */
export async function validateCoupon(
  code: string,
  subtotalUsd: number,
  role: Role,
): Promise<CouponValidation> {
  const coupon = findCoupon(code)
  if (!coupon) return delay({ ok: false, reason: 'invalid' as const }, 260)
  if (new Date(coupon.expiresAt).getTime() <= Date.now()) {
    return delay({ ok: false, reason: 'expired' as const, coupon }, 260)
  }
  if (coupon.roleRestrict && coupon.roleRestrict !== role) {
    return delay({ ok: false, reason: 'merchantOnly' as const, coupon }, 260)
  }
  if (subtotalUsd < coupon.minSubtotalUsd) {
    return delay({ ok: false, reason: 'minNotMet' as const, coupon }, 260)
  }
  return delay({ ok: true as const, coupon }, 260)
}

export type CouponResult = {
  /** Discount applied to the subtotal, in USD. */
  discountUsd: number
  /** Shipping cost after the coupon, in USD. */
  shippingUsd: number
}

/**
 * Compute the effect of a coupon on given subtotal + shipping (all USD).
 * Returns the discount amount and the adjusted shipping. Money-safe.
 */
export function applyCoupon(
  coupon: Coupon,
  subtotalUsd: number,
  shippingUsd: number,
): CouponResult {
  if (coupon.kind === 'freeShipping') {
    return { discountUsd: 0, shippingUsd: 0 }
  }
  if (coupon.kind === 'fixed') {
    const discountCents = Math.min(toCents(coupon.value), toCents(subtotalUsd))
    return { discountUsd: fromCents(discountCents), shippingUsd }
  }
  // percent
  let discountCents = Math.round(toCents(subtotalUsd) * (coupon.value / 100))
  if (coupon.maxDiscountUsd != null) {
    discountCents = Math.min(discountCents, toCents(coupon.maxDiscountUsd))
  }
  return { discountUsd: fromCents(discountCents), shippingUsd }
}

/** Coupons a shopper is currently eligible to see (role + not expired). */
export async function getAvailableCoupons(role: Role): Promise<Coupon[]> {
  const now = Date.now()
  const list = COUPONS.filter(
    (c) =>
      new Date(c.expiresAt).getTime() > now &&
      (!c.roleRestrict || c.roleRestrict === role),
  )
  return delay(list)
}
