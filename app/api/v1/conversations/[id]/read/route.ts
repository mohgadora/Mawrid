import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { markAsRead } from '@/services/chat'

type Params = { params: Promise<{ id: string }> }

/** POST /api/v1/conversations/[id]/read — تعليم رسائل الطرف الآخر كمقروءة. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    await markAsRead(id, user.id)
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
