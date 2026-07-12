/**
 * lib/pricing.ts — تسعير مُوثوق يُحسب في الخادم.
 *
 * القاعدة: لا نثق أبداً بسعر قادم من العميل. السعر يُشتق دائماً من جدول
 * `price_tier` حسب الكمية، ثم يُطبَّق هامش التجزئة لغير التجار.
 */
import 'server-only'
import { db } from '@/lib/db'
import { priceTier, product } from '@/lib/db/schema'
import { inArray, eq } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'
import { pickTierPriceUsd, applyRoleMarkup, type Tier } from '@/lib/tier-pricing'

/** سعر الوحدة (USD) لمنتج واحد وكمية واحدة، حسب الدور. */
export async function resolveUnitPriceUsd(
  productId: string,
  qty: number,
  role: string,
): Promise<number> {
  const tiers = await db.select().from(priceTier).where(inArray(priceTier.productId, [productId]))
  return applyRoleMarkup(pickTierPriceUsd(tiers as Tier[], qty), role)
}

/**
 * يسعّر عدة أسطر دفعة واحدة (استعلام واحد). يرجع الأسطر مع unitPrice الموثوق.
 * يرمي خطأً إن كان أي منتج بلا شرائح سعر.
 */
export async function priceLinesUsd(
  lines: { productId: string; qty: number }[],
  role: string,
): Promise<{ productId: string; qty: number; unitPrice: number }[]> {
  const ids = lines.map((l) => l.productId).filter(Boolean)
  if (!ids.length) return []

  // تحقّق أن كل منتج موجود وفعّال (لا نبيع منتجاً معطّلاً)
  const productRows = await db
    .select({ id: product.id, active: product.active })
    .from(product)
    .where(inArray(product.id, ids))
  const activeIds = new Set(productRows.filter((p) => p.active).map((p) => p.id))
  for (const id of ids) {
    if (!activeIds.has(id)) throw new ValidationError('أحد المنتجات غير متاح أو غير مفعّل')
  }

  const rows = (await db.select().from(priceTier).where(inArray(priceTier.productId, ids))) as (Tier & {
    productId: string
  })[]

  const byProduct = new Map<string, Tier[]>()
  for (const r of rows) {
    const arr = byProduct.get(r.productId) ?? []
    arr.push(r)
    byProduct.set(r.productId, arr)
  }

  return lines.map((l) => {
    const tiers = byProduct.get(l.productId)
    if (!tiers?.length) throw new ValidationError('لا يوجد سعر متاح لأحد المنتجات')
    return {
      productId: l.productId,
      qty: l.qty,
      unitPrice: applyRoleMarkup(pickTierPriceUsd(tiers, l.qty), role),
    }
  })
}
