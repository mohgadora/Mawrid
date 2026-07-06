import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { deleteSeoMeta } from '@/services/seo'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    await deleteSeoMeta(id, guard.id)
    return ok({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
