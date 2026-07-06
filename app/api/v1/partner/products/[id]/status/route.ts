import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { updatePartnerProductStatus } from '@/services/partner'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (body?.active !== undefined) {
      return ok(await updatePartnerProductStatus(id, Boolean(body.active), guard))
    }
    return ok(await updatePartnerProductStatus(id, true, guard))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
