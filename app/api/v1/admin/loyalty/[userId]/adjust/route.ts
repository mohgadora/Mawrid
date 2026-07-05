import { requireAdmin, ok, badRequest, apiError } from '@/lib/api-helpers'
import { adjustPoints } from '@/services/loyalty'
import { NextRequest } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const guard = await requireAdmin(req)
    if ('status' in guard) return guard

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
