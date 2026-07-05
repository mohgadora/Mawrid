import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getPayouts, getTransactions } from '@/services/admin'

export async function GET() {
  const __guard = await requireAdmin()
  if (__guard instanceof NextResponse) return __guard

  try {
    const [payouts, transactions] = await Promise.all([getPayouts(), getTransactions()])
    return ok({ payouts, transactions })
  } catch (err) {
    return serverError(err)
  }
}
