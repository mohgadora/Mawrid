import { requireAdmin, ok, apiError } from '@/lib/api-helpers'
import { getAdminLoyaltyAccounts, getAdminLoyaltySummary } from '@/services/loyalty'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {

    const [summary, accounts] = await Promise.all([
      getAdminLoyaltySummary(),
      getAdminLoyaltyAccounts(),
    ])

    return ok({ summary, accounts })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
