import { NextRequest } from 'next/server'
import { ok, badRequest, apiError } from '@/lib/api-helpers'
import { rateLimit, clientKey } from '@/lib/rate-limit'
import { createGuestOrder } from '@/services/orders'

/** POST /api/v1/orders/guest — إنشاء طلب كضيف (بدون تسجيل). */
export async function POST(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'guest-order'), 10, 60_000)
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.lines) || !body.lines.length) return badRequest('lines is required')
    if (!body.contact?.fullName || !body.contact?.phone) return badRequest('contact.fullName and contact.phone are required')
    const order = await createGuestOrder({
      lines: body.lines,
      contact: body.contact,
      address: body.address ?? {},
      paymentMethod: body.paymentMethod ?? 'cod',
    })
    return ok(order, 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
