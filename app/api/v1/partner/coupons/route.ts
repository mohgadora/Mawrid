import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requirePartner } from '@/lib/api-helpers'
import { supplierListCoupons, supplierCreateCoupon } from '@/services/coupon'

/** GET /api/v1/partner/coupons — كوبونات متجر المورد فقط. */
export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await supplierListCoupons(guard.id, guard.impersonatedSupplierId))
  } catch (err) {
    return apiError(err)
  }
}

/** POST /api/v1/partner/coupons — إنشاء كوبون مرتبط بمتجر المورد. */
export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (!body?.code || !body?.type || body?.value === undefined) {
      return badRequest('code, type, value are required')
    }
    return ok(await supplierCreateCoupon(guard.id, body, guard.impersonatedSupplierId), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
