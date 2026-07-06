/**
 * services/restock.ts — طلبات إشعار التوفّر (restock alerts).
 * عند عودة المخزون > 0 تُرسَل إشعارات للمستخدمين المنتظرين مرة واحدة فقط.
 */
import 'server-only'
import { db } from '@/lib/db'
import { restockRequest, product } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { createNotification } from '@/services/notifications'

/** يسجّل طلب إشعار توفّر (idempotent، ويعيد التسليح إن كان قد أُشعِر سابقاً). */
export async function requestRestock(userId: string, productId: string): Promise<void> {
  const [p] = await db.select({ id: product.id }).from(product).where(eq(product.id, productId)).limit(1)
  if (!p) throw new NotFoundError('المنتج غير موجود')

  await db
    .insert(restockRequest)
    .values({ id: crypto.randomUUID(), userId, productId, notified: false })
    .onConflictDoUpdate({
      target: [restockRequest.productId, restockRequest.userId],
      set: { notified: false },
    })

  await writeAuditLog({ userId, action: 'restock.request', entity: 'product', entityId: productId })
}

export async function hasRestockRequest(userId: string, productId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: restockRequest.id })
    .from(restockRequest)
    .where(and(eq(restockRequest.userId, userId), eq(restockRequest.productId, productId), eq(restockRequest.notified, false)))
    .limit(1)
  return Boolean(row)
}

/**
 * يُشعر كل المنتظرين لمنتج عاد للتوفّر ثم يعلّم طلباتهم كمُشعَرة.
 * آمن للاستدعاء المتكرر — لا يُعيد إشعار من أُشعِر.
 */
export async function notifyRestocked(productId: string): Promise<number> {
  const pending = await db
    .select({ id: restockRequest.id, userId: restockRequest.userId })
    .from(restockRequest)
    .where(and(eq(restockRequest.productId, productId), eq(restockRequest.notified, false)))
  if (!pending.length) return 0

  const [p] = await db.select({ nameAr: product.nameAr, name: product.name }).from(product).where(eq(product.id, productId)).limit(1)
  const name = p?.nameAr ?? p?.name ?? 'المنتج'

  for (const req of pending) {
    await createNotification(
      req.userId,
      'restock',
      'المنتج متوفّر الآن',
      `${name} عاد إلى المخزون — اطلبه قبل نفاده.`,
      `/product/${productId}`,
    ).catch((err) => console.error('[restock] notify failed:', err))
  }

  await db.update(restockRequest).set({ notified: true }).where(eq(restockRequest.productId, productId))
  return pending.length
}
