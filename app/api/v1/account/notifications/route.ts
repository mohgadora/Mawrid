import { NextRequest } from 'next/server'
import { getApiUser, ok, apiError, unauthorized } from '@/lib/api-helpers'
import { getUserNotifications, getUnreadCount } from '@/services/notifications'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(apiUser.id),
      getUnreadCount(apiUser.id),
    ])
    return ok({ notifications, unreadCount })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
