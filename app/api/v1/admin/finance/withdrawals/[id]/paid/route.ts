import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, badRequest, apiError } from '@/lib/api-helpers'
import { markWithdrawalPaid } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const body = await req.json() as { reference?: unknown }
    const reference = String(body.reference ?? '').trim()
    if (!reference) return badRequest('reference مطلوب')

    const updated = await markWithdrawalPaid(id, guard.id, reference)
    return ok(updated)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
