import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, badRequest, apiError } from '@/lib/api-helpers'
import { rejectProduct } from '@/services/approvals'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const body = await req.json() as { reason?: unknown }
    const reason = String(body.reason ?? '').trim()
    if (!reason) return badRequest('reason مطلوب')

    await rejectProduct(id, guard.id, reason)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
