import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, ok, serverError } from '@/lib/api-helpers'
import { getPartnerReportSales } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const from = req.nextUrl.searchParams.get('from') ?? undefined
    const to = req.nextUrl.searchParams.get('to') ?? undefined
    return ok(await getPartnerReportSales(guard, from, to))
  } catch (err) { return serverError(err) }
}
