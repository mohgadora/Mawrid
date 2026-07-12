import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, apiError } from '@/lib/api-helpers'
import { replyToPartnerReview } from '@/services/partner'

type Params = { params: Promise<{ reviewId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { reviewId } = await params
    const body = await req.json()
    if (!body.body?.trim()) return badRequest('الرد مطلوب')
    return ok(await replyToPartnerReview(reviewId, body.body))
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
