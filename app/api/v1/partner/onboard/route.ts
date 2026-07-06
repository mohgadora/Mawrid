import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError } from '@/lib/api-helpers'
import { onboardPartner } from '@/services/partner'

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    const row = await onboardPartner(
      { company: body?.company ?? '', phone: body?.phone, crNumber: body?.crNumber },
      user,
    )
    return ok(row, 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
