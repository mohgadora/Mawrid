import { NextRequest } from 'next/server'
import { ok, serverError } from '@/lib/api-helpers'
import { rateLimit, clientKey } from '@/lib/rate-limit'
import { searchProductsAdvanced, type SearchFilters } from '@/services/catalog'

export async function GET(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'search'), 30, 60_000)
  if (limited) return limited
  try {
    const sp = req.nextUrl.searchParams

    const filters: SearchFilters = {}

    const q = sp.get('q')
    if (q) filters.query = q

    const category = sp.get('category')
    if (category) filters.categorySlug = category

    const supplier = sp.get('supplier')
    if (supplier) filters.supplierId = supplier

    const minPrice = sp.get('minPrice')
    if (minPrice) filters.minPrice = Number(minPrice)

    const maxPrice = sp.get('maxPrice')
    if (maxPrice) filters.maxPrice = Number(maxPrice)

    const minRating = sp.get('minRating')
    if (minRating) filters.minRating = Number(minRating)

    const inStock = sp.get('inStock')
    if (inStock === 'true' || inStock === '1') filters.inStock = true

    const sortBy = sp.get('sortBy')
    if (sortBy && ['price_asc', 'price_desc', 'newest', 'rating', 'relevance'].includes(sortBy)) {
      filters.sortBy = sortBy as SearchFilters['sortBy']
    }

    const page = sp.get('page')
    if (page) filters.page = Number(page)

    const limit = sp.get('limit')
    if (limit) filters.limit = Number(limit)

    const result = await searchProductsAdvanced(filters)
    return ok(result)
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
