import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { getDeliveryZones, upsertDeliveryZone } from '@/services/admin'

export async function GET() {
  const __guard = await requireAdmin()
  if (__guard instanceof NextResponse) return __guard

  try {
    return ok(await getDeliveryZones())
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json().catch(() => null)
    if (!body?.name) return badRequest('name is required')
    const row = await upsertDeliveryZone({
      name: body.name,
      nameEn: body.nameEn,
      city: body.city,
      country: body.country,
      fee: Number(body.fee) || 0,
      minOrder: Number(body.minOrder) || 0,
      active: body.active ?? body.status !== 'inactive',
    })
    return ok(row, 201)
  } catch (err) {
    return apiError(err)
  }
}
