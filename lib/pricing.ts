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
import { RETAIL_MARKUP } from '@/lib/config'
import { ValidationError } from '@/lib/errors'

type Tier = { minQty: number; maxQty: number | null; price: string }

/** يختار سعر الشريحة المطابقة لكمية معيّنة (USD، سعر الجملة قبل الهامش). */
function pickTierPriceUsd(tiers: Tier[], qty: number): number {
  if (!tiers.length) throw new ValidationError('لا يوجد سعر متاح لهذا المنتج')
  const minMoq = Math.min(...tiers.map((t) => t.minQty))
  if (qty < minMoq) {
    throw new ValidationError(`الحد الأدنى للطلب ${minMoq} وحدة`)
  }
  const match =
    tiers
      .filter((t) => qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty))
      .sort((a, b) => b.minQty - a.minQty)[0] ??
    [...tiers].sort((a, b) => a.minQty - b.minQty)[0]
  return Number(match.price)
}

const isWholesaleRole = (role: string) => role === 'merchant'

/** سعر الوحدة (USD) لمنتج واحد وكمية واحدة، حسب الدور. */
export async function resolveUnitPriceUsd(
  productId: string,
  qty: number,
  role: string,
): Promise<number> {
  const tiers = await db.select().from(priceTier).where(inArray(priceTier.productId, [productId]))
  const wholesale = pickTierPriceUsd(tiers as Tier[], qty)
  return isWholesaleRole(role) ? wholesale : wholesale * RETAIL_MARKUP
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
    const wholesale = pickTierPriceUsd(tiers, l.qty)
    return {
      productId: l.productId,
      qty: l.qty,
      unitPrice: isWholesaleRole(role) ? wholesale : wholesale * RETAIL_MARKUP,
    }
  })
}
