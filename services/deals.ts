/**
 * services/deals.ts — Deal of the Day + Clearance sales.
 * الأسعار الأصلية بالدولار؛ يُحسب السعر بعد الخصم بالسنتات عبر lib/money.ts.
 */
import 'server-only'
import { db } from '@/lib/db'
import { dealOfDay, clearanceSale, clearanceSaleProduct, product } from '@/lib/db/schema'
import { eq, and, lte, gte, desc, inArray } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { salePriceUsd } from '@/lib/discounts'

type DbDeal = typeof dealOfDay.$inferSelect

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** يحسب السعر بعد الخصم بأمان (سنتات). */
function applyDiscount(baseUsd: number, type: string, value: number): number {
  return salePriceUsd(baseUsd, type === 'percent' ? 'percent' : 'fixed', value)
}

// ── Deal of the Day ───────────────────────────────────────────────────────

/** عرض اليوم النشط (منتج واحد) مع سعره الأصلي والمخفّض. */
export async function getTodayDeal() {
  const [deal] = await db
    .select()
    .from(dealOfDay)
    .where(and(eq(dealOfDay.date, todayStr()), eq(dealOfDay.active, true)))
    .orderBy(desc(dealOfDay.createdAt))
    .limit(1)
  if (!deal) return null

  const [p] = await db
    .select({ id: product.id, nameAr: product.nameAr, name: product.name, imageUrl: product.imageUrl, marketAvgPrice: product.marketAvgPrice })
    .from(product)
    .where(eq(product.id, deal.productId))
    .limit(1)
  if (!p) return null

  const basePrice = Number(p.marketAvgPrice ?? 0)
  return {
    id: deal.id,
    productId: deal.productId,
    titleAr: deal.titleAr,
    titleEn: deal.titleEn,
    productName: p.nameAr ?? p.name,
    image: p.imageUrl,
    basePrice,
    salePrice: applyDiscount(basePrice, deal.discountType, Number(deal.discount)),
    discountType: deal.discountType,
    discount: Number(deal.discount),
  }
}

export async function listDeals(): Promise<DbDeal[]> {
  return db.select().from(dealOfDay).orderBy(desc(dealOfDay.date)).limit(200)
}

export async function createDeal(
  data: { productId: string; titleAr: string; titleEn?: string | null; discountType: string; discount: number; date: string; active?: boolean },
  adminId: string,
): Promise<DbDeal> {
  if (!data.productId) throw new ValidationError('المنتج مطلوب')
  if (!data.titleAr?.trim()) throw new ValidationError('العنوان بالعربية مطلوب')
  if (!Number.isFinite(data.discount) || data.discount <= 0) throw new ValidationError('قيمة الخصم غير صالحة')
  if (data.discountType === 'percent' && data.discount > 100) throw new ValidationError('نسبة الخصم يجب أن تكون 100% أو أقل')
  if (!data.date) throw new ValidationError('التاريخ مطلوب')

  const [row] = await db
    .insert(dealOfDay)
    .values({
      id: crypto.randomUUID(),
      productId: data.productId,
      titleAr: data.titleAr.trim(),
      titleEn: data.titleEn ?? null,
      discountType: data.discountType === 'fixed' ? 'fixed' : 'percent',
      discount: String(data.discount),
      date: data.date,
      active: data.active ?? true,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'deal.create', entity: 'deal_of_day', entityId: row.id })
  return row
}

export async function deleteDeal(id: string, adminId: string): Promise<void> {
  await db.delete(dealOfDay).where(eq(dealOfDay.id, id))
  await writeAuditLog({ userId: adminId, action: 'deal.delete', entity: 'deal_of_day', entityId: id })
}

// ── Clearance ─────────────────────────────────────────────────────────────

/** عروض التصفية النشطة الآن مع منتجاتها وأسعارها بعد الخصم. */
export async function getActiveClearances() {
  const now = new Date()
  const sales = await db
    .select()
    .from(clearanceSale)
    .where(and(eq(clearanceSale.active, true), lte(clearanceSale.startsAt, now), gte(clearanceSale.endsAt, now)))
    .orderBy(desc(clearanceSale.createdAt))
  if (!sales.length) return []

  const saleIds = sales.map((s) => s.id)
  const items = await db.select().from(clearanceSaleProduct).where(inArray(clearanceSaleProduct.clearanceId, saleIds))
  const productIds = [...new Set(items.map((i) => i.productId))]
  const products = productIds.length
    ? await db
        .select({ id: product.id, nameAr: product.nameAr, name: product.name, imageUrl: product.imageUrl, marketAvgPrice: product.marketAvgPrice })
        .from(product)
        .where(inArray(product.id, productIds))
    : []
  const pMap = Object.fromEntries(products.map((p) => [p.id, p]))

  return sales.map((s) => ({
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    endsAt: s.endsAt.toISOString(),
    products: items
      .filter((i) => i.clearanceId === s.id)
      .map((i) => {
        const p = pMap[i.productId]
        const basePrice = Number(p?.marketAvgPrice ?? 0)
        return {
          productId: i.productId,
          name: p?.nameAr ?? p?.name ?? i.productId,
          image: p?.imageUrl ?? null,
          discountPercent: Number(i.discountPercent),
          basePrice,
          salePrice: applyDiscount(basePrice, 'percent', Number(i.discountPercent)),
        }
      }),
  }))
}

export async function listClearances() {
  return db.select().from(clearanceSale).orderBy(desc(clearanceSale.createdAt)).limit(200)
}

export async function createClearance(
  data: { titleAr: string; titleEn?: string | null; startsAt: string; endsAt: string; active?: boolean; products?: { productId: string; discountPercent: number }[] },
  adminId: string,
) {
  if (!data.titleAr?.trim()) throw new ValidationError('العنوان بالعربية مطلوب')
  if (!data.startsAt || !data.endsAt || new Date(data.startsAt) >= new Date(data.endsAt)) {
    throw new ValidationError('تاريخ البدء يجب أن يكون قبل الانتهاء')
  }
  const id = crypto.randomUUID()
  await db.transaction(async (tx) => {
    await tx.insert(clearanceSale).values({
      id,
      titleAr: data.titleAr.trim(),
      titleEn: data.titleEn ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      active: data.active ?? true,
    })
    const products = (data.products ?? []).filter((p) => p.productId && p.discountPercent > 0 && p.discountPercent <= 100)
    if (products.length) {
      await tx.insert(clearanceSaleProduct).values(
        products.map((p) => ({ id: crypto.randomUUID(), clearanceId: id, productId: p.productId, discountPercent: String(p.discountPercent) })),
      )
    }
  })
  await writeAuditLog({ userId: adminId, action: 'clearance.create', entity: 'clearance_sale', entityId: id })
  return { id }
}

export async function deleteClearance(id: string, adminId: string): Promise<void> {
  await db.delete(clearanceSale).where(eq(clearanceSale.id, id))
  await writeAuditLog({ userId: adminId, action: 'clearance.delete', entity: 'clearance_sale', entityId: id })
}
