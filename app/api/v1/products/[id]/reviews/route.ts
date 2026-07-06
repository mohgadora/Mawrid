import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, getApiUser, unauthorized } from '@/lib/api-helpers'
import { getProductReviews, createReview } from '@/services/reviews'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const user = await getApiUser(req)
    return ok(await getProductReviews(id, user?.id ?? null))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  try {
    const { id } = await params
    const body = await req.json() as { rating?: unknown; title?: unknown; body?: unknown }

    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return badRequest('rating must be integer 1–5')
    }
    const reviewBody = typeof body.body === 'string' ? body.body.trim() : ''
    if (reviewBody.length < 10) return badRequest('body must be at least 10 characters')
    if (reviewBody.length > 2000) return badRequest('body too long')

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : undefined

    const result = await createReview({
      productId: id,
      userId:    user.id,
      rating,
      title:     title || undefined,
      body:      reviewBody,
    })
    return ok(result, 201)
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_REVIEWED') {
      return NextResponse.json({ error: 'لقد قيّمت هذا المنتج سابقاً' }, { status: 409 })
    }
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
