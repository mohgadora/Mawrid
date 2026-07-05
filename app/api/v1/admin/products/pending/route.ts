import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getPendingProducts } from '@/services/approvals'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const data = await getPendingProducts()
    return ok(data)
  } catch (err) {
    return serverError(err)
  }
}
