import { NextRequest } from 'next/server'
import { ok, apiError, badRequest } from '@/lib/api-helpers'
import { getAdsByPlacement } from '@/services/ads'

/** GET /api/v1/ads?placement=home_top — إعلانات موضع معيّن (عام). */
export async function GET(req: NextRequest) {
  try {
    const placement = new URL(req.url).searchParams.get('placement')?.trim()
    if (!placement) return badRequest('placement is required')
    const ads = await getAdsByPlacement(placement)
    return ok(ads.map((a) => ({
      id: a.id, titleAr: a.titleAr, titleEn: a.titleEn, type: a.type,
      imageUrl: a.imageUrl, targetUrl: a.targetUrl, placement: a.placement,
    })))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
