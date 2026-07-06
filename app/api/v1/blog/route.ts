import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { listPublishedPosts } from '@/services/blog'

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(1, Number(new URL(req.url).searchParams.get('page')) || 1)
    return ok(await listPublishedPosts(page))
  } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
