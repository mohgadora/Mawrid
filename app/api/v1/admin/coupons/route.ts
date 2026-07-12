import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, apiError, requireAdmin } from '@/lib/api-helpers'
import { getAdminCoupons, createCoupon } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getAdminCoupons())
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    if (!body.code || !body.type || body.value === undefined) return badRequest('code, type, value are required')
    return ok(await createCoupon(body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
