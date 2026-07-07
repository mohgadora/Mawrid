import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, badRequest, apiError } from '@/lib/api-helpers'
import { updateProductStatus } from '@/services/admin'
import { writeAuditLog } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json() as { active?: unknown }

    if (typeof body.active !== 'boolean') return badRequest('active must be boolean')

    const updated = await updateProductStatus(id, body.active)

    await writeAuditLog({
      userId:   guard.id,
      action:   body.active ? 'product_activate' : 'product_deactivate',
      entity:   'product',
      entityId: id,
    })

    return ok(updated)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
