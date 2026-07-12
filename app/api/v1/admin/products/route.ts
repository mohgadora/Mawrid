import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { getAdminProducts, createAdminProduct } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const products = await getAdminProducts()
    return ok(products)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    if (!body.name?.trim()) return badRequest('name is required')
    return ok(await createAdminProduct(body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
