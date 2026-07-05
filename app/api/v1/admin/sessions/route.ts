import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminSessions } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    return ok(await getAdminSessions())
  } catch (err) {
    return serverError(err)
  }
}
