import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { startOrderConversation } from '@/services/chat'

/** POST /api/v1/conversations/start { orderId } — يبدأ محادثة المشتري مع مورد الطلب. */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    const orderId = String(body?.orderId ?? '').trim()
    if (!orderId) return badRequest('orderId is required')
    const conv = await startOrderConversation(user.id, orderId)
    return ok(conv, 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
