import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { listSeoMeta, upsertSeoMeta } from '@/services/seo'

/** GET /api/v1/admin/seo?entityType= — قائمة تجاوزات SEO. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const entityType = req.nextUrl.searchParams.get('entityType') ?? undefined
    return ok(await listSeoMeta(entityType))
  } catch (err) {
    return apiError(err)
  }
}

/** POST /api/v1/admin/seo — إنشاء/تحديث تجاوز SEO لكيان. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (!body?.entityType || !body?.entityId) return badRequest('entityType and entityId are required')
    return ok(await upsertSeoMeta(body, guard.id), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
