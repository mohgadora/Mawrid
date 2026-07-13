import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { getCouponReport } from '@/services/analytics'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)))
    return ok(await getCouponReport(limit))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
