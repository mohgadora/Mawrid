import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, notFound, requireAdmin, apiError } from '@/lib/api-helpers'
import { upsertDeliveryZone } from '@/services/admin'
import { getZone, deleteZone } from '@/services/shipping'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(_req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const zone = await getZone(id)
    if (!zone) return notFound('Zone not found')
    return ok(zone)
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body?.name) return badRequest('name is required')
    const row = await upsertDeliveryZone({
      id,
      name: body.name,
      nameEn: body.nameEn,
      city: body.city,
      country: body.country,
      fee: Number(body.fee) || 0,
      minOrder: Number(body.minOrder) || 0,
      active: body.active ?? body.status !== 'inactive',
    })
    return ok(row)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(_req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    await deleteZone(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
