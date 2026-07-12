import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { getTopSuppliers } from '@/services/analytics'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 10)))
    return ok(await getTopSuppliers(limit))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
