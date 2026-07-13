import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { requestRestock, hasRestockRequest } from '@/services/restock'

type Params = { params: Promise<{ id: string }> }

/** GET — هل لدى المستخدم طلب إشعار قائم لهذا المنتج؟ */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return ok({ requested: false })
  try {
    const { id } = await params
    return ok({ requested: await hasRestockRequest(user.id, id) })
  } catch (err) {
    return apiError(err)
  }
}

/** POST — طلب إشعار عند توفّر المنتج. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    await requestRestock(user.id, id)
    return ok({ requested: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
