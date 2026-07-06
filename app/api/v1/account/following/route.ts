import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getFollowedShops } from '@/services/follow'

/** GET /api/v1/account/following — المتاجر التي يتابعها المستخدم. */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getFollowedShops(user.id))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
