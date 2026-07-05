import { NextRequest, NextResponse } from 'next/server'
import { ok, requireAdmin, apiError } from '@/lib/api-helpers'
import { revokeAdminSession } from '@/services/admin'

type RouteCtx = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await ctx.params
  try {
    return ok(await revokeAdminSession(id, guard.id))
  } catch (err) {
    return apiError(err)
  }
}
