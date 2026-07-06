import { NextRequest } from 'next/server'
import { ok, serverError } from '@/lib/api-helpers'
import { rateLimit, clientKey } from '@/lib/rate-limit'
import { getProducts, searchProducts } from '@/services/catalog'

export async function GET(req: NextRequest) {
  const limited = rateLimit(clientKey(req, 'products'), 60, 60_000)
  if (limited) return limited
  try {
    const q = req.nextUrl.searchParams.get('q')
    const data = q ? await searchProducts(q) : await getProducts()
    return ok(data)
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
