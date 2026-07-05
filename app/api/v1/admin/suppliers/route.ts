import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { getAdminSuppliers, updateSupplierStatus } from '@/services/admin'
import type { SupplierStatus } from '@/services/admin'

export async function GET() {
  const __guard = await requireAdmin()
  if (__guard instanceof NextResponse) return __guard

  try {
    return ok(await getAdminSuppliers())
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest) {
  const __guard = await requireAdmin(req)
  if (__guard instanceof NextResponse) return __guard

  try {
    const body = await req.json()
    if (!body.id || !body.status) return badRequest('id and status are required')
    const ALLOWED: SupplierStatus[] = ['active', 'pending', 'suspended']
    if (!ALLOWED.includes(body.status)) return badRequest(`status must be one of: ${ALLOWED.join(', ')}`)
    return ok(await updateSupplierStatus(body.id, body.status as SupplierStatus, __guard.id))
  } catch (err) {
    return apiError(err)
  }
}
