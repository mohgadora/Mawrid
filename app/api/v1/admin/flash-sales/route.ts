import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { getFlashSales, createFlashSale } from '@/services/flash-sales'

export async function GET() {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getFlashSales())
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    const id = await createFlashSale(body, guard.id)
    return ok({ id }, 201)
  } catch (err) {
    return apiError(err)
  }
}
