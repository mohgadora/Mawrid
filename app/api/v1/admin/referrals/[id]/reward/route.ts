import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, ok, serverError, badRequest } from '@/lib/api-helpers'
import { rewardReferral } from '@/services/referrals'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { id } = await params
    if (!id) return badRequest('معرّف الإحالة مطلوب')

    await rewardReferral(id, guard.id)
    return ok({ ok: true })
  } catch (err) {
    return serverError(err)
  }
}
