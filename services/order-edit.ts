/**
 * services/order-edit.ts — تعديل كميات الطلب قبل الشحن.
 *
 * يُسمح بالتعديل فقط قبل الشحن. التعديل ذرّي: يضبط المخزون حسب الفروق، يعيد حساب
 * الإجماليات، ويسجّل order_edit + order_edit_payment (مستحق أو مرتجع). عند النقص
 * في طلب مدفوع بالمحفظة يُعاد الفرق للمحفظة فوراً. كل المبالغ بالسنتات.
 */
import 'server-only'
import { db } from '@/lib/db'
import { order, orderLine, orderEvent, orderEdit, orderEditPayment, product as productTable } from '@/lib/db/schema'
import { eq, and, gte, sql, inArray } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { toCents, fromCents, lineTotalUsd } from '@/lib/money'
import { orderTotals } from '@/lib/order-totals'
import { walletDeltaTx } from '@/services/wallet'
import { SHIPPING } from '@/lib/config'
import { deliveryZone } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

const EDITABLE_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'ready_to_ship']

async function shippingFee(subtotalUsd: number): Promise<number> {
  const [zone] = await db.select().from(deliveryZone).where(eq(deliveryZone.active, true)).orderBy(asc(deliveryZone.createdAt)).limit(1)
  if (zone) {
    const freeOver = Number(zone.freeOverAmount ?? 0)
    return subtotalUsd >= freeOver ? 0 : Number(zone.shippingFee)
  }
  return subtotalUsd >= SHIPPING.freeOverUsd ? 0 : SHIPPING.flatUsd
}

export type QtyChange = { orderLineId: string; newQty: number }

/**
 * يعدّل كميات أسطر الطلب (newQty=0 يحذف السطر). يُرجع الفرق السعري والحالة.
 */
export async function editOrderQuantities(
  orderId: string,
  changes: QtyChange[],
  editorId: string,
): Promise<{ priceDiff: number; newTotal: number; settlement: 'due' | 'return' | 'none' }> {
  if (!Array.isArray(changes) || !changes.length) throw new ValidationError('لا توجد تعديلات')

  const result = await db.transaction(async (tx) => {
    const [ord] = await tx.select().from(order).where(eq(order.id, orderId)).for('update').limit(1)
    if (!ord) throw new NotFoundError('الطلب غير موجود')
    if (!EDITABLE_STATUSES.includes(ord.status)) {
      throw new ValidationError('لا يمكن تعديل هذا الطلب بعد شحنه')
    }

    const lines = await tx.select().from(orderLine).where(eq(orderLine.orderId, orderId))
    const lineMap = new Map(lines.map((l) => [l.id, l]))

    const changeLog: { orderLineId: string; productName: string; fromQty: number; toQty: number }[] = []
    let removed = false

    for (const ch of changes) {
      const line = lineMap.get(ch.orderLineId)
      if (!line) throw new ValidationError('أحد الأسطر غير موجود في الطلب')
      const newQty = Math.max(0, Math.trunc(Number(ch.newQty) || 0))
      const delta = newQty - line.qty
      if (delta === 0) continue

      // اضبط مخزون المنتج (المتغيّرات غير مدعومة في التعديل)
      if (line.productId && !line.variantId) {
        if (delta > 0) {
          const upd = await tx
            .update(productTable)
            .set({ stock: sql`${productTable.stock} - ${delta}`, updatedAt: new Date() })
            .where(and(eq(productTable.id, line.productId), gte(productTable.stock, delta)))
            .returning({ id: productTable.id })
          if (!upd.length) throw new ValidationError(`الكمية غير متوفرة للمنتج: ${line.productName}`)
        } else {
          await tx.update(productTable).set({ stock: sql`${productTable.stock} + ${-delta}`, updatedAt: new Date() }).where(eq(productTable.id, line.productId))
        }
      }

      if (newQty === 0) {
        await tx.delete(orderLine).where(eq(orderLine.id, line.id))
        removed = true
      } else {
        const unit = Number(line.unitPrice)
        await tx.update(orderLine).set({ qty: newQty, subtotal: lineTotalUsd(unit, newQty).toFixed(2), cartonQty: Math.ceil(newQty / (line.unitsPerCarton || 1)) }).where(eq(orderLine.id, line.id))
      }
      changeLog.push({ orderLineId: line.id, productName: line.productName, fromQty: line.qty, toQty: newQty })
    }

    if (!changeLog.length) throw new ValidationError('لا يوجد تغيير فعلي في الكميات')

    // أعد حساب الإجماليات من الأسطر الحالية
    const freshLines = await tx.select().from(orderLine).where(eq(orderLine.orderId, orderId))
    const discount = Number(ord.discount)
    const lineSubtotals = freshLines.map((l) => Number(l.subtotal))
    const subtotalOnly = orderTotals(lineSubtotals).subtotalUsd
    const shipUsd = await shippingFee(subtotalOnly)
    const { subtotalUsd, totalUsd: newTotalUsd } = orderTotals(lineSubtotals, shipUsd, discount)
    const oldTotalUsd = Number(ord.total)
    const priceDiffUsd = fromCents(toCents(newTotalUsd) - toCents(oldTotalUsd))

    await tx.update(order).set({
      subtotal: subtotalUsd.toFixed(2),
      shippingFee: shipUsd.toFixed(2),
      total: newTotalUsd.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(order.id, orderId))

    // سجّل التعديل
    const editId = crypto.randomUUID()
    await tx.insert(orderEdit).values({
      id: editId,
      orderId,
      editedBy: editorId,
      editType: removed ? 'remove_item' : 'quantity',
      changeDetails: changeLog,
      priceDiff: priceDiffUsd.toFixed(2),
      status: 'applied',
    })

    // التسوية
    let settlement: 'due' | 'return' | 'none' = 'none'
    if (priceDiffUsd > 0) {
      settlement = 'due'
      await tx.insert(orderEditPayment).values({
        id: crypto.randomUUID(), orderEditId: editId, type: 'due', amount: priceDiffUsd.toFixed(2), status: 'pending',
      })
    } else if (priceDiffUsd < 0) {
      settlement = 'return'
      const refund = -priceDiffUsd
      // إن كان مدفوعاً بالمحفظة، أعِد الفرق فوراً
      if (ord.paymentMethod === 'wallet' && ord.paymentStatus === 'paid' && ord.userId) {
        await walletDeltaTx(tx, ord.userId, { amountUsd: refund, type: 'refund', reference: orderId, note: `تعديل طلب ${ord.ref}` })
        await tx.insert(orderEditPayment).values({
          id: crypto.randomUUID(), orderEditId: editId, type: 'return', amount: refund.toFixed(2), status: 'settled', method: 'wallet', processedAt: new Date(),
        })
      } else {
        await tx.insert(orderEditPayment).values({
          id: crypto.randomUUID(), orderEditId: editId, type: 'return', amount: refund.toFixed(2), status: 'pending',
        })
      }
    }

    await tx.insert(orderEvent).values({
      id: crypto.randomUUID(), orderId, status: 'edited',
      note: `تعديل الطلب — الفرق ${priceDiffUsd.toFixed(2)}$`, createdBy: editorId, createdAt: new Date(),
    })

    return { priceDiff: priceDiffUsd, newTotal: newTotalUsd, settlement }
  })

  await writeAuditLog({ userId: editorId, action: 'order.edit', entity: 'order', entityId: orderId, meta: { priceDiff: result.priceDiff } })
  return result
}

/** تفاصيل طلب للتعديل من لوحة الأدمن: الطلب + أسطره + سجل التعديلات. */
export async function getOrderForEdit(orderId: string) {
  const [ord] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
  if (!ord) throw new NotFoundError('الطلب غير موجود')
  const lines = await db.select().from(orderLine).where(eq(orderLine.orderId, orderId))
  const edits = await getOrderEdits(orderId)
  return {
    id: ord.id,
    ref: ord.ref,
    status: ord.status,
    editable: EDITABLE_STATUSES.includes(ord.status),
    subtotal: Number(ord.subtotal),
    shippingFee: Number(ord.shippingFee),
    discount: Number(ord.discount),
    total: Number(ord.total),
    paymentMethod: ord.paymentMethod,
    paymentStatus: ord.paymentStatus,
    lines: lines.map((l) => ({
      id: l.id,
      productName: l.productName,
      productImage: l.productImage,
      qty: l.qty,
      unitPrice: Number(l.unitPrice),
      subtotal: Number(l.subtotal),
    })),
    edits,
  }
}

/** سجل تعديلات طلب (مع دفعات التسوية). */
export async function getOrderEdits(orderId: string) {
  const edits = await db.select().from(orderEdit).where(eq(orderEdit.orderId, orderId)).orderBy(orderEdit.createdAt)
  if (!edits.length) return []
  const payments = await db.select().from(orderEditPayment).where(inArray(orderEditPayment.orderEditId, edits.map((e) => e.id)))
  return edits.map((e) => ({ ...e, payments: payments.filter((p) => p.orderEditId === e.id) }))
}
