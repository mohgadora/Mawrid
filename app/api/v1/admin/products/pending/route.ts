import { NextRequest } from 'next/server'
import { requireAdmin, ok, apiError } from '@/lib/api-helpers'
import { getAdminProductsPending } from '@/services/admin'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof Response) return guard

  try {
    const result = await getAdminProductsPending()
    return ok(result)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
