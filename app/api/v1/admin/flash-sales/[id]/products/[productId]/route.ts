import { NextRequest, NextResponse } from 'next/server'
import { apiError, requireAdmin } from '@/lib/api-helpers'
import { removeProductFromFlashSale } from '@/services/flash-sales'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; productId: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id, productId } = await params
    await removeProductFromFlashSale(id, productId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
