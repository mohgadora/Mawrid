import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { editOrderQuantities } from '@/services/order-edit'

/** POST /api/v1/admin/orders/[id]/edit { changes: [{orderLineId, newQty}] } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!Array.isArray(body?.changes) || !body.changes.length) return badRequest('changes is required')
    return ok(await editOrderQuantities(id, body.changes, guard.id))
  } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
