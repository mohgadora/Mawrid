import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin, apiError } from '@/lib/api-helpers'
import { approveProduct } from '@/services/approvals'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    await approveProduct(id, guard.id)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
