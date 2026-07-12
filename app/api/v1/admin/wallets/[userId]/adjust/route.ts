import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { adminAdjustBalance } from '@/services/wallet'

type Params = { params: Promise<{ userId: string }> }

/** POST /api/v1/admin/wallets/[userId]/adjust — شحن/خصم يدوي. body: { amount, note? } */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { userId } = await params
    const body = await req.json().catch(() => null)
    const amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount === 0) return badRequest('amount must be a non-zero number')
    const balance = await adminAdjustBalance(guard.id, userId, amount, body?.note)
    return ok({ balance })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
