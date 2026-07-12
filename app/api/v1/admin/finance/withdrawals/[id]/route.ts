import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin, badRequest } from '@/lib/api-helpers'
import { approveWithdrawal, rejectWithdrawal, markWithdrawalPaid } from '@/services/admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json()
    const action: string = body.action ?? body.status

    if (action === 'approve' || action === 'approved') {
      return ok(await approveWithdrawal(id, guard.id))
    }
    if (action === 'reject' || action === 'rejected') {
      if (!body.reason?.trim()) return badRequest('reason is required for rejection')
      return ok(await rejectWithdrawal(id, guard.id, body.reason))
    }
    if (action === 'paid' || action === 'completed') {
      if (!body.reference?.trim()) return badRequest('reference is required')
      return ok(await markWithdrawalPaid(id, guard.id, body.reference))
    }
    return badRequest('action must be: approve, reject, or paid')
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
