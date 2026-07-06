import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { reportPartnerReview } from '@/services/partner'

type Params = { params: Promise<{ reviewId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { reviewId } = await params
    const body = await req.json()
    if (!body.reason?.trim()) return badRequest('السبب مطلوب')
    return ok(await reportPartnerReview(reviewId, body.reason))
  } catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
