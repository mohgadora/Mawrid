import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { getProductVariantsAll, createVariant } from '@/services/variants'
import { getPartnerSupplier } from '@/services/partner'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const sup = await getPartnerSupplier({ id: guard.id, role: guard.role })
    if (!sup) return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    const data = await getProductVariantsAll(id, sup.id)
    return ok(data)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const sup = await getPartnerSupplier({ id: guard.id, role: guard.role })
    if (!sup) return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
    const body = await req.json()
    const variant = await createVariant(id, sup.id, body)
    return ok(variant, 201)
  } catch (err) {
    return apiError(err)
  }
}
