import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, apiError } from '@/lib/api-helpers'
import { markPartnerNotificationRead } from '@/services/partner'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await markPartnerNotificationRead(id))
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
