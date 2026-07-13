import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { getAdminRoles, getPermissionMatrix } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const matrix = req.nextUrl.searchParams.get('matrix')
    if (matrix === '1') return ok(await getPermissionMatrix())
    return ok(await getAdminRoles())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
