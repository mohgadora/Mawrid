import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, serverError } from '@/lib/api-helpers'
import { getPartnerReportSales } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const from = req.nextUrl.searchParams.get('from') ?? undefined
    const to = req.nextUrl.searchParams.get('to') ?? undefined
    const raw = await getPartnerReportSales(guard, from, to)
    return ok({
      summary: {
        totalRevenue: raw.totals.revenue,
        totalOrders: raw.totals.orders,
        totalItems: raw.totals.items,
      },
      orders: raw.rows.map((r) => ({
        orderRef: r.ref,
        date: r.date,
        status: r.status,
        items: r.items,
        revenue: r.revenue,
      })),
    })
  } catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
