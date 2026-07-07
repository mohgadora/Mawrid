import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, badRequest, apiError } from '@/lib/api-helpers'
import { setSupplierCommissionRate } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const body = await req.json() as { rate?: unknown }
    const rate = Number(body.rate)
    if (isNaN(rate)) return badRequest('rate يجب أن يكون رقماً')

    const updated = await setSupplierCommissionRate(id, rate, guard.id)
    return ok(updated)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
