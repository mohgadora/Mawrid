import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, serverError } from '@/lib/api-helpers'
import { getPartnerNotifications } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const result = await getPartnerNotifications()
    // Return flat array so the notifications page can treat data as PartnerNotification[]
    // Also include unread count at top level for the header bell badge
    return NextResponse.json({ data: result.items, unread: result.unread })
  } catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
