import { NextResponse } from 'next/server'
import { ok, serverError, requirePartner } from '@/lib/api-helpers'
import { getPartnerEarnings } from '@/services/partner'

export async function GET() {
  const guard = await requirePartner()
  if (guard instanceof NextResponse) return guard

  try {
    const data = await getPartnerEarnings(guard)
    return ok(data)
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
