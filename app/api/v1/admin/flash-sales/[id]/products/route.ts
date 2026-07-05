import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { addProductToFlashSale } from '@/services/flash-sales'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const { productId, overridePrice, stockLimit } = await req.json()
    const entryId = await addProductToFlashSale(id, productId, overridePrice, stockLimit)
    return ok({ id: entryId }, 201)
  } catch (err) {
    return apiError(err)
  }
}
