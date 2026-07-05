import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, notFound, requireAdmin, apiError } from '@/lib/api-helpers'
import { getZone, getShippingRules, createShippingRule } from '@/services/shipping'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(_req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const rules = await getShippingRules(id)
    return ok(rules)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const zone = await getZone(id)
    if (!zone) return notFound('Zone not found')

    const body = await req.json().catch(() => null)
    if (!body?.name) return badRequest('name is required')

    const rule = await createShippingRule(id, {
      name:           body.name,
      minOrderAmount: body.minOrderAmount !== undefined ? Number(body.minOrderAmount) : 0,
      maxOrderAmount: body.maxOrderAmount !== undefined ? Number(body.maxOrderAmount) : null,
      freeAbove:      body.freeAbove !== undefined ? Number(body.freeAbove) : null,
      baseFee:        body.baseFee !== undefined ? Number(body.baseFee) : 0,
      perKgFee:       body.perKgFee !== undefined ? Number(body.perKgFee) : 0,
      estimatedDays:  body.estimatedDays !== undefined ? Number(body.estimatedDays) : 3,
      active:         body.active ?? true,
    })
    return ok(rule, 201)
  } catch (err) {
    return apiError(err)
  }
}
