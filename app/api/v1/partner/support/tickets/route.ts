import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { getPartnerSupportTickets, createPartnerSupportTicket } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerSupportTickets()) }
  catch (err) { return serverError(err) }
}

export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    if (!body.subject?.trim() || !body.body?.trim()) return badRequest('الموضوع والرسالة مطلوبان')
    return ok(await createPartnerSupportTicket(body))
  } catch (err) { return serverError(err) }
}
