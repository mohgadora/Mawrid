import { NextRequest } from 'next/server'
import { getApiUser, ok, apiError, unauthorized } from '@/lib/api-helpers'
import { markNotificationRead, deleteNotification } from '@/services/notifications'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    const { id } = await params
    await markNotificationRead(id, apiUser.id)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    const { id } = await params
    await deleteNotification(id, apiUser.id)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
