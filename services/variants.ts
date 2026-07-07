import 'server-only'
import { db } from '@/lib/db'
import { productVariant, product } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'

export type VariantInput = {
  sku: string
  barcode?: string
  price: number
  compareAtPrice?: number
  stock: number
  lowStockThreshold?: number
  weight?: number
  images?: string[]
  options: Record<string, string>
  isDefault?: boolean
  active?: boolean
}

export async function getProductVariants(productId: string) {
  return db
    .select()
    .from(productVariant)
    .where(and(eq(productVariant.productId, productId), eq(productVariant.active, true)))
    .orderBy(productVariant.isDefault, productVariant.createdAt)
}

export async function getProductVariantsAll(productId: string, supplierId: string) {
  const [p] = await db.select({ id: product.id }).from(product)
    .where(and(eq(product.id, productId), eq(product.supplierId, supplierId))).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')
  return db.select().from(productVariant).where(eq(productVariant.productId, productId))
}

export async function createVariant(productId: string, supplierId: string, data: VariantInput) {
  const [p] = await db.select({ id: product.id }).from(product)
    .where(and(eq(product.id, productId), eq(product.supplierId, supplierId))).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')
  if (!data.sku?.trim()) throw new ValidationError('SKU مطلوب')
  const id = crypto.randomUUID()
  const [row] = await db.insert(productVariant).values({
    id,
    productId,
    sku: data.sku.trim(),
    barcode: data.barcode ?? null,
    price: String(Math.max(0, data.price)),
    compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
    stock: Math.max(0, Math.trunc(data.stock)),
    lowStockThreshold: data.lowStockThreshold ?? 5,
    weight: data.weight ? String(data.weight) : null,
    images: data.images ?? [],
    options: data.options ?? {},
    isDefault: data.isDefault ?? false,
    active: data.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return row
}

export async function updateVariant(variantId: string, productId: string, supplierId: string, data: Partial<VariantInput>) {
  const [p] = await db.select({ id: product.id }).from(product)
    .where(and(eq(product.id, productId), eq(product.supplierId, supplierId))).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (data.sku !== undefined) patch.sku = data.sku.trim()
  if (data.barcode !== undefined) patch.barcode = data.barcode
  if (data.price !== undefined) patch.price = String(Math.max(0, data.price))
  if (data.compareAtPrice !== undefined) patch.compareAtPrice = data.compareAtPrice ? String(data.compareAtPrice) : null
  if (data.stock !== undefined) patch.stock = Math.max(0, Math.trunc(data.stock))
  if (data.lowStockThreshold !== undefined) patch.lowStockThreshold = data.lowStockThreshold
  if (data.weight !== undefined) patch.weight = data.weight ? String(data.weight) : null
  if (data.images !== undefined) patch.images = data.images
  if (data.options !== undefined) patch.options = data.options
  if (data.isDefault !== undefined) patch.isDefault = data.isDefault
  if (data.active !== undefined) patch.active = data.active

  const [row] = await db.update(productVariant).set(patch).where(
    and(eq(productVariant.id, variantId), eq(productVariant.productId, productId))
  ).returning()
  if (!row) throw new NotFoundError('المتغير غير موجود')
  return row
}

export async function deleteVariant(variantId: string, productId: string, supplierId: string) {
  const [p] = await db.select({ id: product.id }).from(product)
    .where(and(eq(product.id, productId), eq(product.supplierId, supplierId))).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')
  await db.delete(productVariant).where(
    and(eq(productVariant.id, variantId), eq(productVariant.productId, productId))
  )
}
