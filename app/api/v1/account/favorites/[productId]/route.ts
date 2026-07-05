import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { toggleFavorite } from '@/services/account'

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { productId } = await params
    const favorited = await toggleFavorite(productId, user)
    return ok({ favorited })
  } catch (err) {
    return apiError(err)
  }
}
