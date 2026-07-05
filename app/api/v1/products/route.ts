import { NextRequest } from 'next/server'
import { ok, serverError } from '@/lib/api-helpers'
import { getProducts, searchProducts } from '@/services/catalog'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')
    const data = q ? await searchProducts(q) : await getProducts()
    return ok(data)
  } catch (err) {
    return serverError(err)
  }
}
