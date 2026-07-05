import { NextRequest } from 'next/server'
import { getApiUser, ok, apiError, unauthorized } from '@/lib/api-helpers'
import { markAllRead } from '@/services/notifications'

export async function POST(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    await markAllRead(apiUser.id)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
