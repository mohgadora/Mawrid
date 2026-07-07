import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { getRevenueByDay } from '@/services/analytics'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? 30)))
    return ok(await getRevenueByDay(days))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
