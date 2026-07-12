/**
 * services/recommendations.ts — توصيات حتمية مبنية على البيانات (بلا AI).
 * تُرجع كل دالة قائمة معرّفات منتجات مرتّبة؛ يتولّى API ترطيبها عبر getProducts()
 * لإعادة استخدام منطق التسعير/التعيين الموجود.
 */
import 'server-only'
import { db } from '@/lib/db'
import { orderLine, order, product } from '@/lib/db/schema'
import { alias } from 'drizzle-orm/pg-core'
import { eq, and, ne, inArray, sql, desc, notInArray, isNotNull } from 'drizzle-orm'

/**
 * المنتجات التي تُشترى غالباً مع منتج معيّن — self-join على order_line حسب الطلب.
 */
export async function getFrequentlyBoughtTogether(productId: string, limit = 6): Promise<string[]> {
  const ol2 = alias(orderLine, 'ol2')
  const rows = await db
    .select({ id: ol2.productId })
    .from(orderLine)
    .innerJoin(ol2, and(eq(orderLine.orderId, ol2.orderId), ne(ol2.productId, orderLine.productId)))
    .innerJoin(product, and(eq(product.id, ol2.productId), eq(product.active, true)))
    .where(and(eq(orderLine.productId, productId), isNotNull(ol2.productId)))
    .groupBy(ol2.productId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
  return rows.map((r) => r.id).filter((id): id is string => Boolean(id))
}

/** منتجات مشابهة: نفس الفئة، فعّالة، عدا المنتج نفسه. */
export async function getSimilarProducts(productId: string, limit = 8): Promise<string[]> {
  const [p] = await db.select({ categoryId: product.categoryId }).from(product).where(eq(product.id, productId)).limit(1)
  if (!p?.categoryId) return []
  const rows = await db
    .select({ id: product.id })
    .from(product)
    .where(and(eq(product.categoryId, p.categoryId), eq(product.active, true), ne(product.id, productId)))
    .orderBy(desc(product.featured), desc(product.createdAt))
    .limit(limit)
  return rows.map((r) => r.id)
}

/**
 * توصيات شخصية: فئات مشتريات المستخدم السابقة → منتجات لم يشترها بعد.
 */
export async function getPersonalizedRecommendations(userId: string, limit = 8): Promise<string[]> {
  // المنتجات التي اشتراها المستخدم
  const purchased = await db
    .select({ productId: orderLine.productId })
    .from(orderLine)
    .innerJoin(order, eq(orderLine.orderId, order.id))
    .where(eq(order.userId, userId))
    .limit(500)
  const purchasedIds = [...new Set(purchased.map((r) => r.productId).filter((id): id is string => Boolean(id)))]
  if (!purchasedIds.length) return []

  // فئات تلك المنتجات
  const cats = await db
    .select({ categoryId: product.categoryId })
    .from(product)
    .where(inArray(product.id, purchasedIds))
  const categoryIds = [...new Set(cats.map((c) => c.categoryId).filter((id): id is string => Boolean(id)))]
  if (!categoryIds.length) return []

  const rows = await db
    .select({ id: product.id })
    .from(product)
    .where(and(
      inArray(product.categoryId, categoryIds),
      eq(product.active, true),
      notInArray(product.id, purchasedIds),
    ))
    .orderBy(desc(product.featured), desc(product.createdAt))
    .limit(limit)
  return rows.map((r) => r.id)
}
