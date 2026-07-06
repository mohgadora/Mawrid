import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminKpi } from '@/services/admin'

// Auth is enforced by middleware for all /api/v1/admin/* routes
export async function GET() {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return __guard

  try {
    return ok(await getAdminKpi())
  } catch (err) {
    return serverError(err)
  }
}
