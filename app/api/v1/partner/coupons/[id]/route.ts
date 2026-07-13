import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requirePartner } from '@/lib/api-helpers'
import { supplierDeleteCoupon } from '@/services/coupon'

type Params = { params: Promise<{ id: string }> }

/** DELETE /api/v1/partner/coupons/[id] — حذف كوبون يملكه المورد. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    await supplierDeleteCoupon(guard.id, id, guard.impersonatedSupplierId)
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
