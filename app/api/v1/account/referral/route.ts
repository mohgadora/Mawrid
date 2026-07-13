import { getApiUser, ok, unauthorized, apiError } from '@/lib/api-helpers'
import { getOrCreateReferralCode, getReferralsByUser } from '@/services/referrals'

export async function GET() {
  try {
    const apiUser = await getApiUser()
    if (!apiUser) return unauthorized()

    const codeRow = await getOrCreateReferralCode(apiUser.id)
    const referrals = await getReferralsByUser(apiUser.id)

    return ok({ code: codeRow.code, usageCount: codeRow.usageCount, referrals })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
