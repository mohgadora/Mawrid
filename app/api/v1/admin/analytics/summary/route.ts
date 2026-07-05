import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getRevenueSummary, type Period } from '@/services/analytics'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const period = (req.nextUrl.searchParams.get('period') ?? '30d') as Period
    const validPeriods: Period[] = ['7d', '30d', '90d', 'all']
    const safePeriod: Period = validPeriods.includes(period) ? period : '30d'
    return ok(await getRevenueSummary(safePeriod))
  } catch (err) {
    return serverError(err)
  }
}
