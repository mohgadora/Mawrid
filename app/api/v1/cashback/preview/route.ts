import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { calculateCashback } from '@/services/cashback'
import { priceLinesUsd } from '@/lib/pricing'
import { fromCents, lineTotalCents, sumCents } from '@/lib/money'

/**
 * POST /api/v1/cashback/preview — كم استرجاعاً سيربح المشتري من هذه السلة.
 * body: { items: [{ productId, qty }] }
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    const rawItems = Array.isArray(body?.items) ? body.items : []
    const lines = rawItems
      .map((i: { productId?: string; qty?: number }) => ({
        productId: String(i?.productId ?? '').trim(),
        qty: Math.max(1, Math.trunc(Number(i?.qty) || 0)),
      }))
      .filter((l: { productId: string; qty: number }) => l.productId && l.qty > 0)
    if (!lines.length) return badRequest('items is required')

    const priced = await priceLinesUsd(lines, user.role)
    const totalUsd = fromCents(sumCents(priced.map((l) => lineTotalCents(l.unitPrice, l.qty))))
    const productIds = [...new Set(priced.map((l) => l.productId))]
    const cashbackUsd = await calculateCashback(totalUsd, user.id, productIds)
    return ok({ cashbackUsd })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
