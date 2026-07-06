import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, serverError } from '@/lib/api-helpers'
import { markAllPartnerNotificationsRead } from '@/services/partner'

export async function PATCH(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await markAllPartnerNotificationsRead()) }
  catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
