import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getActiveClearances } from '@/services/deals'

/** GET /api/v1/clearance — عروض التصفية النشطة. */
export async function GET(_req: NextRequest) {
  try { return ok(await getActiveClearances()) } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
