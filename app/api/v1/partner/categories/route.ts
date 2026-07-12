import { NextResponse } from 'next/server'
import { ok, apiError, requirePartner } from '@/lib/api-helpers'
import { getPartnerCategories } from '@/services/partner'

export async function GET() {
  const guard = await requirePartner()
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getPartnerCategories())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
