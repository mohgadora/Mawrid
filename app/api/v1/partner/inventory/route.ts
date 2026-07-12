import { NextRequest } from 'next/server'
import { requirePartner, apiError } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { getPartnerInventory } from '@/services/partner'
import { ok } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerInventory(guard)) }
  catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
