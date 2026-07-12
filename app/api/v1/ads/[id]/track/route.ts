import { NextRequest } from 'next/server'
import { ok, apiError, badRequest } from '@/lib/api-helpers'
import { trackImpression, trackClick } from '@/services/ads'

/** POST /api/v1/ads/[id]/track { event: 'impression' | 'click' } — تتبّع (عام). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const event = String(body?.event ?? '')
    if (event === 'impression') await trackImpression(id)
    else if (event === 'click') await trackClick(id)
    else return badRequest('event must be impression or click')
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
