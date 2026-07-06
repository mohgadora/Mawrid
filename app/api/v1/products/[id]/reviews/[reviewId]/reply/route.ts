import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, badRequest, requirePartner } from '@/lib/api-helpers'
import { createReviewReply } from '@/services/reviews'
import { db } from '@/lib/db'
import { productReview, product } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

type Params = { params: Promise<{ id: string; reviewId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id: productId, reviewId } = await params
    const body = await req.json() as { body?: unknown }

    const replyBody = typeof body.body === 'string' ? body.body.trim() : ''
    if (replyBody.length < 5) return badRequest('body too short')
    if (replyBody.length > 1000) return badRequest('body too long')

    // Verify this review belongs to a product owned by this supplier
    if (guard.role !== 'admin') {
      const [row] = await db
        .select({ id: productReview.id })
        .from(productReview)
        .innerJoin(product, eq(product.id, productReview.productId))
        .where(
          and(
            eq(productReview.id, reviewId),
            eq(productReview.productId, productId),
            eq(product.supplierId, guard.impersonatedSupplierId ?? guard.id),
          ),
        )
        .limit(1)

      if (!row) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    return ok(await createReviewReply({ reviewId, userId: guard.id, body: replyBody }), 201)
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
