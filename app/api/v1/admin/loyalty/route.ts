import { requireAdmin, ok, apiError } from '@/lib/api-helpers'
import { getAdminLoyaltyAccounts, getAdminLoyaltySummary } from '@/services/loyalty'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if ('status' in guard) return guard

    const [summary, accounts] = await Promise.all([
      getAdminLoyaltySummary(),
      getAdminLoyaltyAccounts(),
    ])

    return ok({ summary, accounts })
  } catch (err) {
    return apiError(err)
  }
}
