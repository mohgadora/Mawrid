import { NextRequest } from 'next/server'
import { ok, serverError, getApiUser, unauthorized } from '@/lib/api-helpers'
import { toggleReviewHelpful } from '@/services/reviews'

type Params = { params: Promise<{ id: string; reviewId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  try {
    const { reviewId } = await params
    return ok(await toggleReviewHelpful({ reviewId, userId: user.id }))
  } catch (err) {
    return serverError(err)
  }
}
