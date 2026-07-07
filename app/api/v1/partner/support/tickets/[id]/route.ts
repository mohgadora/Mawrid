import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, apiError } from '@/lib/api-helpers'
import { getPartnerSupportTicketDetail } from '@/services/partner'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await getPartnerSupportTicketDetail(id))
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
