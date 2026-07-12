import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requirePartner } from '@/lib/api-helpers'
import { getSupplierSubscription, subscribeSupplier, cancelSupplierSubscription } from '@/services/subscriptions'

/** GET /api/v1/partner/subscription — الاشتراك الحالي للمورد. */
export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getSupplierSubscription(guard.id, guard.impersonatedSupplierId))
  } catch (err) {
    return apiError(err)
  }
}

/** POST /api/v1/partner/subscription { planId, cycle } — اشتراك/ترقية. */
export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    const planId = String(body?.planId ?? '').trim()
    const cycle = body?.cycle === 'yearly' ? 'yearly' : 'monthly'
    if (!planId) return badRequest('planId is required')
    return ok(await subscribeSupplier(guard.id, planId, cycle, guard.impersonatedSupplierId), 201)
  } catch (err) {
    return apiError(err)
  }
}

/** DELETE /api/v1/partner/subscription — إلغاء الاشتراك. */
export async function DELETE(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    await cancelSupplierSubscription(guard.id, guard.impersonatedSupplierId)
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
