import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin } from '@/lib/api-helpers'
import { getAdminBuyers } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    return ok(await getAdminBuyers())
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
