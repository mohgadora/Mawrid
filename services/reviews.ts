import 'server-only'
import { db } from '@/lib/db'
import { productReview, reviewReply, reviewHelpful, user, order, orderLine } from '@/lib/db/schema'
import { eq, desc, and, sql, count, avg } from 'drizzle-orm'

export interface ReviewWithReplies {
  id: string
  productId: string
  userId: string
  authorName: string
  orderId: string | null
  rating: number
  title: string | null
  body: string
  helpfulCount: number
  verified: boolean
  createdAt: string
  replies: {
    id: string
    userId: string
    authorName: string
    body: string
    createdAt: string
  }[]
}

export interface ReviewSummary {
  averageRating: number
  totalCount: number
  distribution: { stars: number; count: number; pct: number }[]
  reviews: ReviewWithReplies[]
}

export async function getProductReviews(
  productId: string,
  viewerUserId?: string | null,
): Promise<ReviewSummary & { userHelpfulIds: string[] }> {
  const [rows, statsRows, replyRows] = await Promise.all([
    db
      .select({
        id:          productReview.id,
        productId:   productReview.productId,
        userId:      productReview.userId,
        authorName:  user.name,
        orderId:     productReview.orderId,
        rating:      productReview.rating,
        title:       productReview.title,
        body:        productReview.body,
        helpfulCount: productReview.helpfulCount,
        verified:    productReview.verified,
        createdAt:   productReview.createdAt,
      })
      .from(productReview)
      .innerJoin(user, eq(user.id, productReview.userId))
      .where(eq(productReview.productId, productId))
      .orderBy(desc(productReview.createdAt))
      .limit(50),

    db
      .select({
        rating: productReview.rating,
        cnt:    count(),
      })
      .from(productReview)
      .where(eq(productReview.productId, productId))
      .groupBy(productReview.rating),

    db
      .select({
        reviewId:    reviewReply.reviewId,
        id:          reviewReply.id,
        userId:      reviewReply.userId,
        authorName:  user.name,
        body:        reviewReply.body,
        createdAt:   reviewReply.createdAt,
      })
      .from(reviewReply)
      .innerJoin(user, eq(user.id, reviewReply.userId))
      .where(
        sql`${reviewReply.reviewId} IN (
          SELECT id FROM product_review WHERE "productId" = ${productId}
        )`,
      )
      .orderBy(reviewReply.createdAt),
  ])

  // Helpful votes by this viewer
  let userHelpfulIds: string[] = []
  if (viewerUserId) {
    const helpfulRows = await db
      .select({ reviewId: reviewHelpful.reviewId })
      .from(reviewHelpful)
      .where(eq(reviewHelpful.userId, viewerUserId))
    userHelpfulIds = helpfulRows.map((h) => h.reviewId)
  }

  // Build replies map
  const repliesMap = new Map<string, ReviewWithReplies['replies']>()
  for (const r of replyRows) {
    const list = repliesMap.get(r.reviewId) ?? []
    list.push({
      id:         r.id,
      userId:     r.userId,
      authorName: r.authorName,
      body:       r.body,
      createdAt:  r.createdAt.toISOString(),
    })
    repliesMap.set(r.reviewId, list)
  }

  const reviews: ReviewWithReplies[] = rows.map((r) => ({
    id:          r.id,
    productId:   r.productId,
    userId:      r.userId,
    authorName:  r.authorName,
    orderId:     r.orderId,
    rating:      r.rating,
    title:       r.title,
    body:        r.body,
    helpfulCount: r.helpfulCount,
    verified:    r.verified,
    createdAt:   r.createdAt.toISOString(),
    replies:     repliesMap.get(r.id) ?? [],
  }))

  // Stats — computed from full-table statsRows, not the paginated rows array
  const distMap    = new Map(statsRows.map((s) => [s.rating, Number(s.cnt)]))
  const totalCount = statsRows.reduce((s, r) => s + Number(r.cnt), 0)
  const weightedSum = statsRows.reduce((s, r) => s + r.rating * Number(r.cnt), 0)
  const avgRating  = totalCount > 0 ? weightedSum / totalCount : 0
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const cnt = distMap.get(stars) ?? 0
    return { stars, count: cnt, pct: totalCount > 0 ? Math.round((cnt / totalCount) * 100) : 0 }
  })

  return {
    averageRating: Math.round(avgRating * 10) / 10,
    totalCount,
    distribution,
    reviews,
    userHelpfulIds,
  }
}

export async function createReview(params: {
  productId: string
  userId: string
  rating: number
  title?: string
  body: string
}): Promise<{ id: string }> {
  // One review per user per product
  const existing = await db
    .select({ id: productReview.id })
    .from(productReview)
    .where(
      and(
        eq(productReview.productId, params.productId),
        eq(productReview.userId, params.userId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    throw Object.assign(new Error('ALREADY_REVIEWED'), { status: 409 })
  }

  // Check verified purchase (delivered order containing this product)
  const verifiedRow = await db
    .select({ orderId: order.id })
    .from(order)
    .innerJoin(orderLine, eq(orderLine.orderId, order.id))
    .where(
      and(
        eq(order.userId, params.userId),
        eq(order.status, 'delivered'),
        eq(orderLine.productId, params.productId),
      ),
    )
    .limit(1)

  const verified = verifiedRow.length > 0
  const orderId  = verifiedRow[0]?.orderId ?? null

  const id = crypto.randomUUID()
  await db.insert(productReview).values({
    id,
    productId: params.productId,
    userId:    params.userId,
    orderId,
    rating:    params.rating,
    title:     params.title ?? null,
    body:      params.body,
    verified,
  })
  return { id }
}

export async function createReviewReply(params: {
  reviewId: string
  userId: string
  body: string
}): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  await db.insert(reviewReply).values({
    id,
    reviewId: params.reviewId,
    userId:   params.userId,
    body:     params.body,
  })
  return { id }
}

export async function toggleReviewHelpful(params: {
  reviewId: string
  userId: string
}): Promise<{ helpful: boolean; count: number }> {
  const existing = await db
    .select({ id: reviewHelpful.id })
    .from(reviewHelpful)
    .where(
      and(
        eq(reviewHelpful.reviewId, params.reviewId),
        eq(reviewHelpful.userId, params.userId),
      ),
    )
    .limit(1)

  let helpful: boolean
  if (existing.length > 0) {
    await db
      .delete(reviewHelpful)
      .where(eq(reviewHelpful.id, existing[0].id))
    helpful = false
  } else {
    await db.insert(reviewHelpful).values({
      id:       crypto.randomUUID(),
      reviewId: params.reviewId,
      userId:   params.userId,
    })
    helpful = true
  }

  // Update cached count
  await db.execute(
    sql`UPDATE product_review
        SET "helpfulCount" = (
          SELECT COUNT(*) FROM review_helpful WHERE "reviewId" = ${params.reviewId}
        )
        WHERE id = ${params.reviewId}`,
  )

  const [updated] = await db
    .select({ helpfulCount: productReview.helpfulCount })
    .from(productReview)
    .where(eq(productReview.id, params.reviewId))
    .limit(1)

  return { helpful, count: updated?.helpfulCount ?? 0 }
}
