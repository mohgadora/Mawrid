import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { getFavorites } from '@/services/account'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getFavorites(user))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
