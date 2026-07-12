import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getUnreadCount } from '@/services/chat'

/** GET /api/v1/conversations/unread-count — عدد الرسائل غير المقروءة. */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok({ count: await getUnreadCount(user.id) })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
