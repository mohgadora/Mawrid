import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { getProfile, updateProfile } from '@/services/account'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getProfile(user))
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON')
    const { name, phone, company, country } = body
    return ok(await updateProfile({ name, phone, company, country }, user))
  } catch (err) {
    return apiError(err)
  }
}
