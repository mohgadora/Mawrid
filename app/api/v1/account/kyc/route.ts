import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getMerchantKycStatus, submitMerchantKyc } from '@/services/account'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getMerchantKycStatus(user))
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    return ok(await submitMerchantKyc(body ?? {}, user), 201)
  } catch (err) {
    return apiError(err)
  }
}
