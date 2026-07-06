import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { getPartnerStockMovements } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const productId = req.nextUrl.searchParams.get('productId')
    if (!productId) return badRequest('productId مطلوب')
    return ok(await getPartnerStockMovements(productId))
  } catch (err) { return serverError(err) }
}
