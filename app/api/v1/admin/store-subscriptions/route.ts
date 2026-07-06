import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { adminListSubscriptions } from '@/services/subscriptions'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await adminListSubscriptions())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
