import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { validateCoupon } from '@/services/coupon'
import { priceLinesUsd } from '@/lib/pricing'
import { fromCents, lineTotalCents, sumCents } from '@/lib/money'

/**
 * POST /api/v1/coupons/validate
 * body: { code, items: [{ productId, qty, variantId? }] }
 * يُعيد حساب المجموع الفرعي على الخادم (لا يثق بأي سعر من العميل) ثم يتحقق.
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  const limited = rateLimit(`${identityKey(req, 'coupon', user.id)}:validate`, 30, 60_000)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => null)
    const code = String(body?.code ?? '').trim()
    if (!code) return badRequest('code is required')

    const rawItems = Array.isArray(body?.items) ? body.items : []
    const lines = rawItems
      .map((i: { productId?: string; qty?: number }) => ({
        productId: String(i?.productId ?? '').trim(),
        qty: Math.max(1, Math.trunc(Number(i?.qty) || 0)),
      }))
      .filter((l: { productId: string; qty: number }) => l.productId && l.qty > 0)

    if (!lines.length) return badRequest('items is required')

    // إعادة تسعير موثوقة من الخادم
    const priced = await priceLinesUsd(lines, user.role)
    const subtotalUsd = fromCents(sumCents(priced.map((l) => lineTotalCents(l.unitPrice, l.qty))))
    const productIds = [...new Set(priced.map((l) => l.productId))]

    const result = await validateCoupon(code, user.id, { subtotalUsd, productIds })

    return ok({
      valid: result.valid,
      message: result.message,
      discountUsd: result.discountUsd,
      freeShipping: result.freeShipping,
      code: result.coupon?.code ?? code.toUpperCase(),
      type: result.coupon?.type ?? null,
    })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
