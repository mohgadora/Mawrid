import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { listBonusRules, createBonusRule } from '@/services/wallet'

/** GET /api/v1/admin/wallet-bonuses — قواعد بونص الشحن. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await listBonusRules())
  } catch (err) {
    return apiError(err)
  }
}

/** POST /api/v1/admin/wallet-bonuses — إنشاء قاعدة بونص. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (body?.minTopup === undefined || !body?.bonusType || body?.bonusValue === undefined) {
      return badRequest('minTopup, bonusType, bonusValue are required')
    }
    return ok(await createBonusRule(body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
