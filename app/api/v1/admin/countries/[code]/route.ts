import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { updateCountry } from '@/services/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { code } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('request body is required')
    }
    const row = await updateCountry(code, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.nameEn !== undefined ? { nameEn: body.nameEn } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
      ...(body.enabled !== undefined ? { active: Boolean(body.enabled) } : {}),
    })
    return ok(row)
  } catch (err) {
    return apiError(err)
  }
}
