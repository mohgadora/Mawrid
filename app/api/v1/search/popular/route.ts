import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getPopularSearches } from '@/services/search-history'

/** GET /api/v1/search/popular — عبارات البحث الشائعة (عام). */
export async function GET(_req: NextRequest) {
  try { return ok(await getPopularSearches()) } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
