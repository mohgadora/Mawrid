import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getTodayDeal } from '@/services/deals'

/** GET /api/v1/deals/today — عرض اليوم النشط (أو null). */
export async function GET(_req: NextRequest) {
  try { return ok(await getTodayDeal()) } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
