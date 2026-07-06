import { NextRequest } from 'next/server'
import { ok, apiError, notFound } from '@/lib/api-helpers'
import { getPublishedPost } from '@/services/blog'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await getPublishedPost(slug)
    if (!post) return notFound('المقال غير موجود')
    return ok(post)
  } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
