import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError } from '@/lib/api-helpers'
import { getPartnerProducts, createPartnerProduct } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getPartnerProducts(guard))
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    return ok(await createPartnerProduct(body ?? {}, guard), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
