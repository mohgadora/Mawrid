/**
 * services/coupons.ts — coupon validation & discount computation.
 *
 * The discount is always recomputed server-side from the real cart subtotal
 * (see `services/orders.ts`). The public `/api/v1/coupons/validate` endpoint
 * uses `previewCoupon` only to show the shopper a discount estimate in the UI.
 */
import 'server-only'
import { db } from '@/lib/db'
import { coupon, couponUsage, order as orderTable } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'

export type CouponRow = typeof coupon.$inferSelect

export type CouponDiscount = {
  coupon: CouponRow
  /** Monetary discount applied to the subtotal (0 for free-shipping coupons). */
  discountUsd: number
  /** True when the coupon waives the shipping fee. */
  freeShipping: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Compute how much a (already-fetched, already-valid) coupon takes off a given
 * subtotal / shipping fee. Pure — no DB, no throwing.
 */
export function computeCouponDiscount(
  row: CouponRow,
  subtotalUsd: number,
  shippingUsd: number,
): CouponDiscount {
  const value = Number(row.value)
  const maxDiscount = row.maxDiscountAmount != null ? Number(row.maxDiscountAmount) : null

  let discountUsd = 0
  let freeShipping = false

  if (row.type === 'free_shipping') {
    freeShipping = true
  } else if (row.type === 'fixed') {
    discountUsd = value
  } else {
    // percentage (default)
    discountUsd = (subtotalUsd * value) / 100
  }

  if (maxDiscount != null && discountUsd > maxDiscount) discountUsd = maxDiscount
  // Never discount more than the subtotal.
  if (discountUsd > subtotalUsd) discountUsd = subtotalUsd
  if (discountUsd < 0) discountUsd = 0

  return { coupon: row, discountUsd: round2(discountUsd), freeShipping }
}

/**
 * Validate a coupon code against the current context and return the discount.
 * Throws `ValidationError` (mapped to HTTP 400 by `apiError`) with a friendly
 * Arabic message when the coupon can't be applied.
 *
 * @param userId  The buyer's id, or `null`/`undefined` for guest checkout.
 */
export async function validateCoupon(params: {
  code: string
  subtotalUsd: number
  shippingUsd: number
  userId?: string | null
}): Promise<CouponDiscount> {
  const code = String(params.code ?? '').trim()
  if (!code) throw new ValidationError('أدخل رمز الكوبون')

  const rows = await db
    .select()
    .from(coupon)
    .where(sql`lower(${coupon.code}) = lower(${code})`)
    .limit(1)

  const row = rows[0]
  if (!row) throw new ValidationError('رمز الكوبون غير صحيح')
  if (!row.active) throw new ValidationError('هذا الكوبون غير مفعّل')

  const now = Date.now()
  if (row.startsAt && row.startsAt.getTime() > now) {
    throw new ValidationError('لم يبدأ سريان هذا الكوبون بعد')
  }
  if (row.expiresAt && row.expiresAt.getTime() < now) {
    throw new ValidationError('انتهت صلاحية هذا الكوبون')
  }

  const minOrder = row.minOrderAmount != null ? Number(row.minOrderAmount) : 0
  if (minOrder > 0 && params.subtotalUsd < minOrder) {
    throw new ValidationError(`الحد الأدنى لاستخدام الكوبون هو ${minOrder.toFixed(2)}`)
  }

  if (row.usageLimitTotal != null && row.usedCount >= row.usageLimitTotal) {
    throw new ValidationError('تم استنفاد هذا الكوبون')
  }

  if (row.firstOrderOnly) {
    if (!params.userId) {
      throw new ValidationError('هذا الكوبون مخصّص للطلب الأول — سجّل الدخول لاستخدامه')
    }
    const prior = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orderTable)
      .where(eq(orderTable.userId, params.userId))
    if ((prior[0]?.n ?? 0) > 0) {
      throw new ValidationError('هذا الكوبون مخصّص للطلب الأول فقط')
    }
  }

  if (params.userId && row.usageLimitPerCustomer > 0) {
    const used = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(couponUsage)
      .where(and(eq(couponUsage.couponId, row.id), eq(couponUsage.userId, params.userId)))
    if ((used[0]?.n ?? 0) >= row.usageLimitPerCustomer) {
      throw new ValidationError('لقد استخدمت هذا الكوبون من قبل')
    }
  }

  return computeCouponDiscount(row, params.subtotalUsd, params.shippingUsd)
}
