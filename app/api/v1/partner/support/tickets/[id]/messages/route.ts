import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { addPartnerTicketMessage } from '@/services/partner'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json()
    if (!body.body?.trim()) return badRequest('الرسالة مطلوبة')
    return ok(await addPartnerTicketMessage(id, body.body))
  } catch (err) { return serverError(err) }
}
