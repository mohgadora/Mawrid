import { NextResponse } from 'next/server'
import { ok, serverError, requirePartner } from '@/lib/api-helpers'
import { getPartnerOrders } from '@/services/partner'

export async function GET() {
  const guard = await requirePartner()
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getPartnerOrders(guard))
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
