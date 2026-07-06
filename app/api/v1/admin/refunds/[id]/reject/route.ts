import { NextRequest } from 'next/server'
import { requireAdmin, ok, apiError, badRequest } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { rejectRefund } from '@/services/refunds'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard
    const { id } = await params
    const body = await req.json().catch(() => ({})) as { reason?: string; adminNote?: string }
    if (!body.reason) return badRequest('reason is required')
    await rejectRefund(id, guard.id, body.reason, body.adminNote)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
