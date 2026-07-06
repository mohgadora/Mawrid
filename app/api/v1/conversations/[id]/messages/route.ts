import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { getMessages, sendMessage } from '@/services/chat'

type Params = { params: Promise<{ id: string }> }

/** GET /api/v1/conversations/[id]/messages?cursor= — رسائل المحادثة. */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const cursor = new URL(req.url).searchParams.get('cursor') ?? undefined
    return ok(await getMessages(id, user.id, { cursor }))
  } catch (err) {
    return apiError(err)
  }
}

/** POST /api/v1/conversations/[id]/messages { body, images? } — إرسال رسالة. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  const limited = rateLimit(`${identityKey(req, 'chat', user.id)}:send`, 60, 60_000)
  if (limited) return limited
  try {
    const { id } = await params
    const data = await req.json().catch(() => null)
    if (!data?.body || typeof data.body !== 'string') return badRequest('body is required')
    const msg = await sendMessage(id, user.id, data.body, Array.isArray(data.images) ? data.images : [])
    return ok(msg, 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
