import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, notFound, requireAdmin } from '@/lib/api-helpers'
import { getFlashSale, updateFlashSale, deleteFlashSale } from '@/services/flash-sales'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const sale = await getFlashSale(id)
    if (!sale) return notFound('العرض غير موجود')
    return ok(sale)
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json()
    await updateFlashSale(id, body, guard.id)
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    await deleteFlashSale(id, guard.id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
