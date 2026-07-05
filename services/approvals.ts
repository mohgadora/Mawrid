import 'server-only'
import { db } from '@/lib/db'
import { product, productApprovalHistory, supplier } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

export async function getPendingProducts() {
  const rows = await db.select({
    id: product.id,
    name: product.nameAr,
    nameEn: product.name,
    sku: product.sku,
    status: product.status,
    imageUrl: product.imageUrl,
    supplierId: product.supplierId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }).from(product)
    .where(eq(product.status, 'pending_approval'))
    .orderBy(desc(product.createdAt))
    .limit(200)

  const supIds = [...new Set(rows.map(r => r.supplierId).filter(Boolean))]
  const supRows = supIds.length
    ? await db.select({ id: supplier.id, name: supplier.nameAr, nameEn: supplier.name }).from(supplier).where(inArray(supplier.id, supIds as string[]))
    : []
  const supMap = Object.fromEntries(supRows.map(s => [s.id, s.name ?? s.nameEn]))

  return rows.map(r => ({
    ...r,
    supplierName: supMap[r.supplierId ?? ''] ?? r.supplierId ?? '',
  }))
}

export async function approveProduct(productId: string, adminUserId: string) {
  const [p] = await db.select().from(product).where(eq(product.id, productId)).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')

  await db.update(product).set({ status: 'approved', active: true, updatedAt: new Date() }).where(eq(product.id, productId))

  if (p.supplierId) {
    await db.insert(productApprovalHistory).values({
      id: crypto.randomUUID(),
      productId,
      supplierId: p.supplierId,
      status: 'approved',
      reviewedBy: adminUserId,
      createdAt: new Date(),
    })
  }

  await writeAuditLog({ userId: adminUserId, action: 'product.approved', entity: 'product', entityId: productId })
}

export async function rejectProduct(productId: string, adminUserId: string, reason: string) {
  const [p] = await db.select().from(product).where(eq(product.id, productId)).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')

  await db.update(product).set({ status: 'rejected', active: false, updatedAt: new Date() }).where(eq(product.id, productId))

  if (p.supplierId) {
    await db.insert(productApprovalHistory).values({
      id: crypto.randomUUID(),
      productId,
      supplierId: p.supplierId,
      status: 'rejected',
      reason,
      reviewedBy: adminUserId,
      createdAt: new Date(),
    })
  }

  await writeAuditLog({ userId: adminUserId, action: 'product.rejected', entity: 'product', entityId: productId, meta: { reason } })
}

export async function getProductApprovalHistory(productId: string) {
  return db.select().from(productApprovalHistory)
    .where(eq(productApprovalHistory.productId, productId))
    .orderBy(desc(productApprovalHistory.createdAt))
}
