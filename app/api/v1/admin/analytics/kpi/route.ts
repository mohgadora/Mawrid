import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getKpiSnapshot } from '@/services/analytics'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    return ok(await getKpiSnapshot())
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
