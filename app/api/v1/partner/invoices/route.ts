import { NextResponse } from 'next/server'
import { ok, serverError, requirePartner } from '@/lib/api-helpers'
import { getPartnerInvoices } from '@/services/partner'

export async function GET() {
  const guard = await requirePartner()
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getPartnerInvoices(guard))
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
