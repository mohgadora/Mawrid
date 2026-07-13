import { NextRequest } from 'next/server'
import { getApiUser, ok, apiError } from '@/lib/api-helpers'
import { getRecentSearches } from '@/services/search-history'

/** GET /api/v1/search/recent — آخر عمليات بحث المستخدم. */
export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return ok([])
  try { return ok(await getRecentSearches(user.id)) } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
