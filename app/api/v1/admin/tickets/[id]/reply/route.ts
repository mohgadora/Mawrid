import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { replyToTicket } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.body?.trim()) return badRequest('body is required')
    return ok(await replyToTicket(id, body.body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
