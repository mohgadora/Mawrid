/**
 * services/follow.ts — متابعة المتاجر (shop follow).
 * كل تغيّر يحدّث عدّاد supplier.followerCount ذرّياً داخل معاملة.
 */
import 'server-only'
import { db } from '@/lib/db'
import { shopFollower, supplier, product } from '@/lib/db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

export async function isFollowing(userId: string, supplierId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: shopFollower.id })
    .from(shopFollower)
    .where(and(eq(shopFollower.userId, userId), eq(shopFollower.supplierId, supplierId)))
    .limit(1)
  return Boolean(row)
}

export async function followShop(userId: string, supplierId: string): Promise<{ following: boolean; followerCount: number }> {
  const [sup] = await db.select({ id: supplier.id }).from(supplier).where(eq(supplier.id, supplierId)).limit(1)
  if (!sup) throw new NotFoundError('المتجر غير موجود')

  const followerCount = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(shopFollower)
      .values({ id: crypto.randomUUID(), userId, supplierId })
      .onConflictDoNothing({ target: [shopFollower.supplierId, shopFollower.userId] })
      .returning({ id: shopFollower.id })
    if (inserted.length) {
      const [row] = await tx
        .update(supplier)
        .set({ followerCount: sql`${supplier.followerCount} + 1` })
        .where(eq(supplier.id, supplierId))
        .returning({ n: supplier.followerCount })
      return row?.n ?? 0
    }
    const [row] = await tx.select({ n: supplier.followerCount }).from(supplier).where(eq(supplier.id, supplierId)).limit(1)
    return row?.n ?? 0
  })

  await writeAuditLog({ userId, action: 'shop.follow', entity: 'supplier', entityId: supplierId })
  return { following: true, followerCount }
}

export async function unfollowShop(userId: string, supplierId: string): Promise<{ following: boolean; followerCount: number }> {
  const followerCount = await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(shopFollower)
      .where(and(eq(shopFollower.userId, userId), eq(shopFollower.supplierId, supplierId)))
      .returning({ id: shopFollower.id })
    if (deleted.length) {
      const [row] = await tx
        .update(supplier)
        .set({ followerCount: sql`GREATEST(${supplier.followerCount} - 1, 0)` })
        .where(eq(supplier.id, supplierId))
        .returning({ n: supplier.followerCount })
      return row?.n ?? 0
    }
    const [row] = await tx.select({ n: supplier.followerCount }).from(supplier).where(eq(supplier.id, supplierId)).limit(1)
    return row?.n ?? 0
  })

  await writeAuditLog({ userId, action: 'shop.unfollow', entity: 'supplier', entityId: supplierId })
  return { following: false, followerCount }
}

export type FollowedShop = {
  id: string
  name: string
  nameAr: string | null
  logo: string | null
  rating: string
  followerCount: number
  productCount: number
}

/** المتاجر التي يتابعها المستخدم مع عدد منتجات كل متجر. */
export async function getFollowedShops(userId: string): Promise<FollowedShop[]> {
  const follows = await db
    .select({ supplierId: shopFollower.supplierId })
    .from(shopFollower)
    .where(eq(shopFollower.userId, userId))
    .orderBy(desc(shopFollower.createdAt))
    .limit(200)
  const ids = follows.map((f) => f.supplierId)
  if (!ids.length) return []

  const sups = await db
    .select({
      id: supplier.id, name: supplier.name, nameAr: supplier.nameAr,
      logo: supplier.logo, rating: supplier.rating, followerCount: supplier.followerCount,
    })
    .from(supplier)
    .where(inArray(supplier.id, ids))

  const counts = await db
    .select({ supplierId: product.supplierId, n: sql<number>`COUNT(*)`.as('n') })
    .from(product)
    .where(and(inArray(product.supplierId, ids), eq(product.active, true)))
    .groupBy(product.supplierId)
  const countMap = Object.fromEntries(counts.map((c) => [c.supplierId, Number(c.n)]))

  // احفظ ترتيب المتابعة
  const order = Object.fromEntries(ids.map((id, i) => [id, i]))
  return sups
    .map((s) => ({ ...s, productCount: countMap[s.id] ?? 0 }))
    .sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0))
}
