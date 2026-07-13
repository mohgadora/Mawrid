import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getUserConversations } from '@/services/chat'

/** GET /api/v1/conversations — محادثات المستخدم مع آخر رسالة وعدد غير المقروء. */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const page = Math.max(1, Number(new URL(req.url).searchParams.get('page')) || 1)
    return ok(await getUserConversations(user.id, page))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
