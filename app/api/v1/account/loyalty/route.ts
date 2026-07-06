import { getApiUser, ok, unauthorized, apiError } from '@/lib/api-helpers'
import { getLoyaltyAccount, getLoyaltyTransactions } from '@/services/loyalty'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req)
    if (!apiUser) return unauthorized()

    const [account, transactions] = await Promise.all([
      getLoyaltyAccount(apiUser.id),
      getLoyaltyTransactions(apiUser.id, 20),
    ])

    return ok({ account, transactions })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
