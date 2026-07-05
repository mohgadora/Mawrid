import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { updateVariant, deleteVariant } from '@/services/variants'
import { getPartnerSupplier } from '@/services/partner'

type Params = { params: Promise<{ id: string; variantId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  const { id: productId, variantId } = await params

  try {
    const sup = await getPartnerSupplier({ id: guard.id, role: guard.role })
    if (!sup) return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    const body = await req.json()
    const updated = await updateVariant(variantId, productId, sup.id, body)
    return ok(updated)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  const { id: productId, variantId } = await params

  try {
    const sup = await getPartnerSupplier({ id: guard.id, role: guard.role })
    if (!sup) return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    await deleteVariant(variantId, productId, sup.id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}
