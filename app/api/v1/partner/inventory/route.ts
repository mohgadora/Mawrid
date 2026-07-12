import { NextRequest } from 'next/server'
import { requirePartner, apiError, ok } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { getPartnerInventory } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerInventory(guard)) }
  catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
