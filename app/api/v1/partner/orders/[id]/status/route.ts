import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { updatePartnerOrderStatus } from '@/services/partner'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.status) return badRequest('status مطلوب')
    return ok(await updatePartnerOrderStatus(id, body.status, { note: body.note, trackingNumber: body.trackingNumber }))
  } catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
