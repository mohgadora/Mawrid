import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { listDeals, createDeal } from '@/services/deals'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await listDeals())
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (!body?.productId || !body?.titleAr || body?.discount === undefined || !body?.date) {
      return badRequest('productId, titleAr, discount, date are required')
    }
    return ok(await createDeal(body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
