import { NextRequest } from 'next/server'
import { getApiUser, ok, apiError, unauthorized, badRequest } from '@/lib/api-helpers'
import { createRefundRequest, getRefundRequests } from '@/services/refunds'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    const rows = await getRefundRequests(apiUser.id)
    return ok(rows)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    const body = (await req.json()) as {
      orderId?: string
      reason?: string
      description?: string
      orderLineId?: string
      images?: string[]
    }
    if (!body.orderId) return badRequest('orderId is required')
    if (!body.reason) return badRequest('reason is required')
    const result = await createRefundRequest(apiUser.id, {
      orderId:     body.orderId,
      orderLineId: body.orderLineId,
      reason:      body.reason,
      description: body.description,
      images:      body.images,
    })
    return ok(result, 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
