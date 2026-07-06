import { NextRequest } from 'next/server'
import { requirePartner } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { getPartnerInventory } from '@/services/partner'
import { serverError, ok } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerInventory()) }
  catch (err) { return serverError(err) }
}
