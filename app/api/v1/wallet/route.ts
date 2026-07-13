import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getOrCreateWallet } from '@/services/wallet'

/** GET /api/v1/wallet — ملخّص محفظة المستخدم الحالي. */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const w = await getOrCreateWallet(user.id)
    return ok({
      balance: Number(w.balance),
      lifetimeCredit: Number(w.lifetimeCredit),
      lifetimeDebit: Number(w.lifetimeDebit),
      currency: w.currency,
    })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
