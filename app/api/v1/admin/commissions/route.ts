import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { getCommissionReport } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getCommissionReport())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
