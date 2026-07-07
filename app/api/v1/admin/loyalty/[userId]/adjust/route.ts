import { requireAdmin, ok, badRequest, apiError } from '@/lib/api-helpers'
import { adjustPoints } from '@/services/loyalty'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {

    const { userId } = await params
    const body = await req.json() as { delta?: unknown; note?: unknown }
    const delta = Number(body.delta)
    const note  = String(body.note ?? '').trim()

    if (!Number.isInteger(delta) || delta === 0) {
      return badRequest('delta must be a non-zero integer')
    }
    if (!note) {
      return badRequest('note is required')
    }

    const result = await adjustPoints(userId, delta, guard.id, note)
    return ok(result)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
