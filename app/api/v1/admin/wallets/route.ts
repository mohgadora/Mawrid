import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { adminGetUserWallet } from '@/services/wallet'

/** GET /api/v1/admin/wallets?userId=... — محفظة مستخدم وعملياتها. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const userId = new URL(req.url).searchParams.get('userId')?.trim()
    if (!userId) return badRequest('userId is required')
    return ok(await adminGetUserWallet(userId))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
