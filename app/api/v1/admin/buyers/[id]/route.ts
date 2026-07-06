import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { updateUserBanned } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  try {
    const body = await req.json()
    if (typeof body.banned !== 'boolean') return badRequest('banned (boolean) is required')
    return ok(await updateUserBanned(id, body.banned, guard.id))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
