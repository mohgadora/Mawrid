import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, badRequest, ok, apiError } from '@/lib/api-helpers'
import { getOrders, createOrder } from '@/services/orders'
import { rateLimit, identityKey } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getOrders(user))
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  const limited = rateLimit(`${identityKey(req, 'orders', user.id)}:create`, 20, 60_000)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.lines) || !body.lines.length) {
      return badRequest('lines is required')
    }
    const order = await createOrder(
      {
        lines: body.lines,
        address: body.address ?? { label: body.addressLabel ?? 'الرئيسي' },
        paymentMethod: body.paymentMethod ?? 'cod',
      },
      user,
    )
    return ok(order, 201)
  } catch (err) {
    return apiError(err)
  }
}
