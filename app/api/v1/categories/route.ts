import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getCategories, getCategoryWithProducts } from '@/services/catalog'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    // بوجود slug نُرجع الفئة مع منتجاتها (يستهلكها عميل الويب)، وإلا قائمة الفئات.
    const data = slug ? await getCategoryWithProducts(slug) : await getCategories()
    return ok(data)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
