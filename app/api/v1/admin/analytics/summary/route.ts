import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
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
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
