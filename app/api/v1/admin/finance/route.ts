import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { getPayouts, getTransactions } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const type = req.nextUrl.searchParams.get('type')
    if (type === 'payouts') return ok(await getPayouts())
    if (type === 'transactions') return ok(await getTransactions())
    const [payouts, transactions] = await Promise.all([getPayouts(), getTransactions()])
    return ok({ payouts, transactions })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
