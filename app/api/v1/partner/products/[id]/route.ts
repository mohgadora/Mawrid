import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { getPartnerProduct, updatePartnerProduct, deletePartnerProduct } from '@/services/partner'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await getPartnerProduct(id, guard))
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    return ok(await updatePartnerProduct(id, body ?? {}, guard))
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    await deletePartnerProduct(id, guard)
    return ok({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
