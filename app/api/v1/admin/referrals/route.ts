import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, ok, apiError } from '@/lib/api-helpers'
import { getAdminReferrals, getAdminReferralStats } from '@/services/referrals'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard

    const [stats, referrals] = await Promise.all([
      getAdminReferralStats(),
      getAdminReferrals(),
    ])

    return ok({ stats, referrals })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
