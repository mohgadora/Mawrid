import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, badRequest, serverError } from '@/lib/api-helpers'
import { adjustPartnerStock } from '@/services/partner'
import { writeAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    if (!body.productId || body.delta === undefined || !body.reason) {
      return badRequest('productId, delta, reason مطلوبة')
    }
    const result = await adjustPartnerStock(body)
    await writeAuditLog({ userId: guard.id, action: 'stock_adjustment', entity: 'product', entityId: body.productId, meta: { delta: body.delta, reason: body.reason } })
    return ok(result)
  } catch (err) { return serverError(err) }
}
