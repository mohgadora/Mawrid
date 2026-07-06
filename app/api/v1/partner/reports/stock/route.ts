import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, serverError } from '@/lib/api-helpers'
import { getPartnerInventory } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerInventory()) }
  catch (err) { return serverError(err) }
}
