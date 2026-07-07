import { NextRequest } from 'next/server'
import { getApiUser, badRequest, ok, apiError } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { validateCoupon } from '@/services/coupons'

/**
 * POST /api/v1/coupons/validate
 * Public (works for guests). Returns a discount preview for the given code.
 * The authoritative discount is recomputed when the order is placed.
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)

  const limited = rateLimit(identityKey(req, 'coupon-validate', user?.id), 20, 60_000)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.code !== 'string') {
      return badRequest('code is required')
    }
    const subtotalUsd = Math.max(0, Number(body.subtotal) || 0)
    const shippingUsd = Math.max(0, Number(body.shipping) || 0)

    const result = await validateCoupon({
      code: body.code,
      subtotalUsd,
      shippingUsd,
      userId: user?.id ?? null,
    })

    return ok({
      code: result.coupon.code,
      type: result.coupon.type,
      discountUsd: result.discountUsd,
      freeShipping: result.freeShipping,
    })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204 })
}
