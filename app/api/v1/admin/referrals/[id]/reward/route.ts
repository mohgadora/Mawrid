import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, ok, badRequest, apiError } from '@/lib/api-helpers'
import { rewardReferral } from '@/services/referrals'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard

    const { id } = await params
    if (!id) return badRequest('معرّف الإحالة مطلوب')

    await rewardReferral(id, guard.id)
    return ok({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
