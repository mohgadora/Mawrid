import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getSuppliers, getSupplierWithProducts } from '@/services/catalog'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const data = slug ? await getSupplierWithProducts(slug) : await getSuppliers()
    return ok(data)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
