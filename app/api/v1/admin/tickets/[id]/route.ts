import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, serverError, requireAdmin } from '@/lib/api-helpers'
import { updateTicketStatus } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.status) return badRequest('status is required')
    return ok(await updateTicketStatus(id, body.status, guard.id))
  } catch (err) {
    return serverError(err)
  }
}
