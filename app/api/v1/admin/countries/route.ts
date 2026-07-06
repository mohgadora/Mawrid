import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { getAdminCountries, createCountry } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return __guard

  try {
    return ok(await getAdminCountries())
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json().catch(() => null)
    if (!body?.code || !body?.name || !body?.nameEn || !body?.currency) {
      return badRequest('code, name, nameEn, and currency are required')
    }
    const row = await createCountry(body)
    return ok(row, 201)
  } catch (err) {
    return apiError(err)
  }
}
