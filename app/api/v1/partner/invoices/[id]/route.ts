import { NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { getPartnerInvoiceDetail } from '@/services/partner'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner()
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await getPartnerInvoiceDetail(id, guard))
  } catch (err) {
    return apiError(err)
  }
}
