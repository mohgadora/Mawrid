import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { updateDriverLocation } from '@/services/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __guard = await requireAdmin(req)
  if (__guard instanceof NextResponse) return __guard

  try {
    const { id } = await params
    const body = await req.json()
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return badRequest('lat must be a number between -90 and 90')
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return badRequest('lng must be a number between -180 and 180')

    let status: string | undefined
    if (body.status != null) {
      const ALLOWED = ['offline', 'online', 'busy', 'delivering']
      if (!ALLOWED.includes(body.status)) return badRequest(`status must be one of: ${ALLOWED.join(', ')}`)
      status = body.status
    }

    await updateDriverLocation(id, lat, lng, status)
    return ok({ updated: true })
  } catch (err) {
    return apiError(err)
  }
}
