import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { updateShippingRule, deleteShippingRule } from '@/services/shipping'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { ruleId } = await params
    const body = await req.json().catch(() => ({}))
    const rule = await updateShippingRule(ruleId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.minOrderAmount !== undefined ? { minOrderAmount: Number(body.minOrderAmount) } : {}),
      ...('maxOrderAmount' in body ? { maxOrderAmount: body.maxOrderAmount !== null ? Number(body.maxOrderAmount) : null } : {}),
      ...('freeAbove' in body ? { freeAbove: body.freeAbove !== null ? Number(body.freeAbove) : null } : {}),
      ...(body.baseFee !== undefined ? { baseFee: Number(body.baseFee) } : {}),
      ...(body.perKgFee !== undefined ? { perKgFee: Number(body.perKgFee) } : {}),
      ...(body.estimatedDays !== undefined ? { estimatedDays: Number(body.estimatedDays) } : {}),
      ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
    })
    return ok(rule)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { ruleId } = await params
    await deleteShippingRule(ruleId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}
