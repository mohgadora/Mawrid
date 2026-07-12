import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, apiError } from '@/lib/api-helpers'
import { getPartnerReviews } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const reviews = await getPartnerReviews()
    const summary = {
      total: reviews.length,
      average: reviews.length
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
      pendingReplies: reviews.filter((r) => !r.reply).length,
      fiveStarCount: reviews.filter((r) => r.rating === 5).length,
    }
    return ok({ reviews, summary })
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
