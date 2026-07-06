import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { followShop, unfollowShop, isFollowing } from '@/services/follow'

type Params = { params: Promise<{ id: string }> }

/** GET — هل يتابع المستخدم هذا المتجر؟ */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return ok({ following: false })
  try {
    const { id } = await params
    return ok({ following: await isFollowing(user.id, id) })
  } catch (err) {
    return apiError(err)
  }
}

/** POST — متابعة المتجر. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    return ok(await followShop(user.id, id))
  } catch (err) {
    return apiError(err)
  }
}

/** DELETE — إلغاء المتابعة. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    return ok(await unfollowShop(user.id, id))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
