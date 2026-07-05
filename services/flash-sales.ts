/**
 * services/flash-sales.ts — Flash Sales / Time-limited Deals data layer.
 */
import 'server-only'
import { db } from '@/lib/db'
import { flashSale, flashSaleProduct, product } from '@/lib/db/schema'
import { eq, and, lte, gte, desc } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'

function validateSale(data: { startsAt: Date | string; endsAt: Date | string; discountValue: number; discountType: string }) {
  const starts = new Date(data.startsAt)
  const ends = new Date(data.endsAt)
  if (starts >= ends) throw new Error('startsAt يجب أن يكون قبل endsAt')
  if (data.discountValue <= 0) throw new Error('قيمة الخصم يجب أن تكون أكبر من صفر')
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    throw new Error('نسبة الخصم يجب أن تكون 100% أو أقل')
  }
}

export async function getFlashSales() {
  return db.select().from(flashSale).orderBy(desc(flashSale.startsAt)).limit(200)
}

export async function getActiveFlashSales() {
  const now = new Date()
  return db
    .select()
    .from(flashSale)
    .where(and(eq(flashSale.active, true), lte(flashSale.startsAt, now), gte(flashSale.endsAt, now)))
}

export async function getFlashSale(id: string) {
  const [sale] = await db.select().from(flashSale).where(eq(flashSale.id, id))
  if (!sale) return null

  const items = await db
    .select({
      id:            flashSaleProduct.id,
      flashSaleId:   flashSaleProduct.flashSaleId,
      productId:     flashSaleProduct.productId,
      overridePrice: flashSaleProduct.overridePrice,
      stockLimit:    flashSaleProduct.stockLimit,
      soldCount:     flashSaleProduct.soldCount,
      productName:   product.name,
      productNameAr: product.nameAr,
      productImage:  product.imageUrl,
      productSku:    product.sku,
    })
    .from(flashSaleProduct)
    .innerJoin(product, eq(flashSaleProduct.productId, product.id))
    .where(eq(flashSaleProduct.flashSaleId, id))

  return { ...sale, products: items }
}

export async function createFlashSale(
  data: {
    name: string
    nameEn?: string
    startsAt: Date | string
    endsAt: Date | string
    discountType: string
    discountValue: number
    maxDiscountAmount?: number
    active?: boolean
  },
  adminUserId: string,
) {
  validateSale(data)
  const id = crypto.randomUUID()
  await db.insert(flashSale).values({
    id,
    name:              data.name,
    nameEn:            data.nameEn ?? null,
    startsAt:          new Date(data.startsAt),
    endsAt:            new Date(data.endsAt),
    discountType:      data.discountType,
    discountValue:     String(data.discountValue),
    maxDiscountAmount: data.maxDiscountAmount != null ? String(data.maxDiscountAmount) : null,
    active:            data.active ?? true,
    createdBy:         adminUserId,
  })
  await writeAuditLog({ userId: adminUserId, action: 'flash_sale.created', entity: 'flash_sale', entityId: id })
  return id
}

export async function updateFlashSale(
  id: string,
  data: Partial<{
    name: string
    nameEn: string
    startsAt: Date | string
    endsAt: Date | string
    discountType: string
    discountValue: number
    maxDiscountAmount: number
    active: boolean
  }>,
  adminUserId: string,
) {
  if (data.startsAt || data.endsAt || data.discountValue != null || data.discountType) {
    const [existing] = await db.select().from(flashSale).where(eq(flashSale.id, id))
    if (!existing) throw new Error('لم يتم العثور على العرض')
    const merged = {
      startsAt:      data.startsAt ?? existing.startsAt,
      endsAt:        data.endsAt ?? existing.endsAt,
      discountValue: data.discountValue ?? Number(existing.discountValue),
      discountType:  data.discountType ?? existing.discountType,
    }
    validateSale(merged)
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined)              patch.name = data.name
  if (data.nameEn !== undefined)            patch.nameEn = data.nameEn
  if (data.startsAt !== undefined)          patch.startsAt = new Date(data.startsAt)
  if (data.endsAt !== undefined)            patch.endsAt = new Date(data.endsAt)
  if (data.discountType !== undefined)      patch.discountType = data.discountType
  if (data.discountValue !== undefined)     patch.discountValue = String(data.discountValue)
  if (data.maxDiscountAmount !== undefined) patch.maxDiscountAmount = data.maxDiscountAmount != null ? String(data.maxDiscountAmount) : null
  if (data.active !== undefined)            patch.active = data.active

  await db.update(flashSale).set(patch).where(eq(flashSale.id, id))
  await writeAuditLog({ userId: adminUserId, action: 'flash_sale.updated', entity: 'flash_sale', entityId: id, meta: patch })
}

export async function deleteFlashSale(id: string, adminUserId: string) {
  await db.delete(flashSale).where(eq(flashSale.id, id))
  await writeAuditLog({ userId: adminUserId, action: 'flash_sale.deleted', entity: 'flash_sale', entityId: id })
}

export async function addProductToFlashSale(
  flashSaleId: string,
  productId: string,
  overridePrice?: string | number,
  stockLimit?: number,
) {
  const id = crypto.randomUUID()
  await db.insert(flashSaleProduct).values({
    id,
    flashSaleId,
    productId,
    overridePrice: overridePrice != null ? String(overridePrice) : null,
    stockLimit:    stockLimit ?? null,
    soldCount:     0,
  })
  return id
}

export async function removeProductFromFlashSale(flashSaleId: string, productId: string) {
  await db
    .delete(flashSaleProduct)
    .where(and(eq(flashSaleProduct.flashSaleId, flashSaleId), eq(flashSaleProduct.productId, productId)))
}
