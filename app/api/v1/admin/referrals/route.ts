import { NextResponse } from 'next/server'
import { requireAdmin, ok, serverError } from '@/lib/api-helpers'
import { getAdminReferrals, getAdminReferralStats } from '@/services/referrals'

export async function GET() {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard

    const [stats, referrals] = await Promise.all([
      getAdminReferralStats(),
      getAdminReferrals(),
    ])

    return ok({ stats, referrals })
  } catch (err) {
    return serverError(err)
  }
}
