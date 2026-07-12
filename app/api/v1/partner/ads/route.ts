import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requirePartner } from '@/lib/api-helpers'
import { supplierCreateAd } from '@/services/ads'

/** POST /api/v1/partner/ads — إعلان مورد (يُنشأ بحالة pending للموافقة). */
export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (!body?.titleAr || !body?.imageUrl || !body?.type || !body?.placement) {
      return badRequest('titleAr, imageUrl, type, placement are required')
    }
    return ok(await supplierCreateAd(guard.id, body, guard.impersonatedSupplierId), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
