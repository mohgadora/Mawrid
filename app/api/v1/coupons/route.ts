import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getAvailableCoupons } from '@/services/coupon'

/** GET /api/v1/coupons — الكوبونات العامة المتاحة للعرض (بطاقات المشتري). */
export async function GET(_req: NextRequest) {
  try {
    return ok(await getAvailableCoupons())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
