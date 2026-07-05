import { getApiUser, ok, unauthorized, badRequest, apiError } from '@/lib/api-helpers'
import { redeemPoints } from '@/services/loyalty'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()

    const body = await req.json() as { points?: unknown; orderId?: unknown; note?: unknown }
    const points = Number(body.points)

    if (!Number.isInteger(points) || points <= 0) {
      return badRequest('points must be a positive integer')
    }

    const result = await redeemPoints(
      apiUser.id,
      points,
      body.orderId ? String(body.orderId) : undefined,
      body.note ? String(body.note) : undefined,
    )
    return ok(result)
  } catch (err) {
    return apiError(err)
  }
}
