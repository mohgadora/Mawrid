import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError, badRequest } from '@/lib/api-helpers'
import { getPartnerOrderDetail, updatePartnerOrderStatus } from '@/services/partner'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await getPartnerOrderDetail(id, guard))
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json() as { status?: unknown; note?: unknown; trackingNumber?: unknown }
    const newStatus = String(body.status ?? '')
    if (!newStatus) return badRequest('الحالة مطلوبة')

    // فوّض إلى الخدمة المعتمدة: تتحقق من الملكية وتفرض آلة الحالة المسموحة
    // (تتوقف عند "shipped"). المورد لا يمكنه وسم طلبه "delivered" ذاتياً — وهو ما
    // كان يفتح أرباحه/استرجاعه بلا تأكيد تسليم حقيقي.
    const updated = await updatePartnerOrderStatus(
      id,
      newStatus,
      { note: body.note ? String(body.note).slice(0, 500) : undefined, trackingNumber: body.trackingNumber ? String(body.trackingNumber) : undefined },
      guard,
    )
    return ok({ success: true, status: updated.status })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
