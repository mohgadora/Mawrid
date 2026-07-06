import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { updateApprovalStatus } from '@/services/admin'
import type { ApprovalStatus } from '@/services/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const ALLOWED: ApprovalStatus[] = ['pending', 'approved', 'rejected']
    if (!body?.status || !ALLOWED.includes(body.status)) {
      return badRequest(`status must be one of: ${ALLOWED.join(', ')}`)
    }
    const result = await updateApprovalStatus(id, body.status as ApprovalStatus, guard.id)
    return ok(result)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
