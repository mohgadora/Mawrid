import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { updatePartnerStore } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  return ok({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    return ok(await updatePartnerStore(body ?? {}, guard))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
