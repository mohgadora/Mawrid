import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { setBuyerType } from '@/services/account'

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    const role = body?.role === 'merchant' ? 'merchant' : 'consumer'
    return ok(await setBuyerType({ role, company: body?.company }, user))
  } catch (err) {
    return apiError(err)
  }
}
