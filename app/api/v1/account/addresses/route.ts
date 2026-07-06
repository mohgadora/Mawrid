import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, badRequest, ok, apiError } from '@/lib/api-helpers'
import { getAddresses, addAddress } from '@/services/account'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getAddresses(user))
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    if (!body?.line1 || !body?.city) return badRequest('line1 and city are required')
    return ok(await addAddress(body, user), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
