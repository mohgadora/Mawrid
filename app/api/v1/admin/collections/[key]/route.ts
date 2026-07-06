import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requireAdmin, apiError } from '@/lib/api-helpers'
import { getAdminCollectionItems, saveAdminCollectionItems } from '@/services/admin-collections'
import { isAllowedCollectionKey } from '@/lib/admin-collection-keys'

type RouteCtx = { params: Promise<{ key: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { key } = await ctx.params
  if (!isAllowedCollectionKey(key)) return badRequest('Invalid collection key')

  try {
    const items = await getAdminCollectionItems(key)
    return ok(items)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { key } = await ctx.params
  if (!isAllowedCollectionKey(key)) return badRequest('Invalid collection key')

  try {
    const body = await req.json().catch(() => null)
    if (!Array.isArray(body?.items)) return badRequest('items array is required')
    const items = await saveAdminCollectionItems(key, body.items, guard.id)
    return ok(items)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
