import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { updateDriverStatus } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  try {
    const body = await req.json()
    if (!body.status) return badRequest('status is required')
    return ok(await updateDriverStatus(id, body.status, guard.id))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
