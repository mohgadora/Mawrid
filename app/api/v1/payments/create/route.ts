import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { createPaymentInvoice } from '@/services/payment'
import { siteUrl } from '@/lib/config'

/** POST /api/v1/payments/create { orderId } — ينشئ فاتورة Moyasar ويعيد رابط الدفع. */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  const limited = rateLimit(`${identityKey(req, 'payment', user.id)}:create`, 10, 60_000)
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null)
    const orderId = String(body?.orderId ?? '').trim()
    if (!orderId) return badRequest('orderId is required')
    return ok(await createPaymentInvoice(user.id, orderId, siteUrl()))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
