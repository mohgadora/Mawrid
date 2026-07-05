import { NextResponse } from 'next/server'
import { ok, requireAdmin, serverError } from '@/lib/api-helpers'
import { getCommissionReport } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getCommissionReport())
  } catch (err) {
    return serverError(err)
  }
}
