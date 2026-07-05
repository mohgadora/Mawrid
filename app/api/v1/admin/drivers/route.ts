import { NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminDrivers } from '@/services/admin'

export async function GET() {
  const __guard = await requireAdmin()
  if (__guard instanceof NextResponse) return __guard

  try {
    return ok(await getAdminDrivers())
  } catch (err) {
    return serverError(err)
  }
}
