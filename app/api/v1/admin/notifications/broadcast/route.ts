import { NextRequest } from 'next/server'
import { requireAdmin, ok, apiError, badRequest } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { broadcastNotification } from '@/services/notifications'

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard
    const body = (await req.json()) as { type?: string; title?: string; body?: string; link?: string; userIds?: string[] }
    if (!body.type || !body.title || !body.body) return badRequest('type, title, body are required')
    await broadcastNotification(body.type, body.title, body.body, body.link, body.userIds)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
