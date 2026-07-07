import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, apiError } from '@/lib/api-helpers'
import { getPartnerReportEarnings } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const from = req.nextUrl.searchParams.get('from') ?? undefined
    const to = req.nextUrl.searchParams.get('to') ?? undefined
    const raw = await getPartnerReportEarnings(guard, from, to)
    return ok({
      summary: {
        totalGross: raw.totals.gross,
        commission: raw.totals.commission,
        netEarnings: raw.totals.net,
      },
      rows: raw.rows.map((r) => ({
        date: r.date,
        orderId: r.orderId,
        gross: r.gross,
        commissionRate: r.rate,
        commissionAmount: r.commission,
        net: r.net,
        status: r.status,
      })),
    })
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
