import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminProducts } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const products = await getAdminProducts()
    return ok(products)
  } catch (err) {
    return serverError(err)
  }
}
