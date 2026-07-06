import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminBuyers } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return __guard

  try {
    return ok(await getAdminBuyers())
  } catch (err) {
    return serverError(err)
  }
}
