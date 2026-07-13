import { NextRequest } from 'next/server'
import { ok, apiError, badRequest, getApiUser } from '@/lib/api-helpers'
import { getProducts } from '@/services/catalog'
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
} from '@/services/recommendations'

/**
 * GET /api/v1/recommendations?type=similar|fbt|personalized&productId=...
 * يُرجع منتجات مُرطّبة عبر getProducts() (نفس تعيين الكتالوج).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') ?? 'personalized'
    const productId = url.searchParams.get('productId') ?? ''

    let ids: string[] = []
    if (type === 'similar') {
      if (!productId) return badRequest('productId is required')
      ids = await getSimilarProducts(productId)
    } else if (type === 'fbt') {
      if (!productId) return badRequest('productId is required')
      ids = await getFrequentlyBoughtTogether(productId)
    } else if (type === 'personalized') {
      const user = await getApiUser(req)
      if (!user) return ok([])
      ids = await getPersonalizedRecommendations(user.id)
    } else {
      return badRequest('invalid type')
    }

    if (!ids.length) return ok([])
    const all = await getProducts()
    const byId = new Map(all.map((p) => [p.id, p]))
    const products = ids.map((id) => byId.get(id)).filter(Boolean)
    return ok(products)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
