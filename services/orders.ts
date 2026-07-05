/**
 * services/orders.ts — Order data layer backed 100% by Neon/Drizzle.
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  order,
  orderLine,
  orderEvent,
  product as productTable,
  productVariant,
  priceTier,
  deliveryZone,
} from '@/lib/db/schema'
import { eq, desc, and, inArray, asc, gte, sql, notInArray } from 'drizzle-orm'
import { priceLinesUsd } from '@/lib/pricing'
import { SHIPPING } from '@/lib/config'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { resolveActor, type Actor } from '@/lib/actor'
import { writeAuditLog } from '@/lib/audit'

import type { OrderStatus, OrderEvent, OrderLine, OrderAddress, Order } from '@/lib/order-types'
export type { OrderStatus, OrderEvent, OrderLine, OrderAddress, Order } from '@/lib/order-types'

type DbOrder = typeof order.$inferSelect
type DbLine = typeof orderLine.$inferSelect
type DbEvent = typeof orderEvent.$inferSelect

const NON_CANCELLABLE: OrderStatus[] = ['shipped', 'out_for_delivery', 'delivered']

function mapOrder(row: DbOrder, lines: DbLine[], events: DbEvent[]): Order {
  const subtotal = Number(row.subtotal)
  const shipping = Number(row.shippingFee)
  const discount = Number(row.discount)
  const total = Number(row.total)
  const addr = (row.shippingAddress as Partial<OrderAddress> | null) ?? {}

  return {
    id: row.id,
    ref: row.ref,
    createdAt: row.createdAt.toISOString(),
    status: row.status as OrderStatus,
    timeline: events
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((e) => ({
        status: e.status as OrderStatus,
        at: e.createdAt.toISOString(),
      })),
    lines: lines.map((l) => ({
      productId: l.productId ?? '',
      productName: l.productName,
      productImage: l.productImage ?? null,
      qty: l.qty,
      unitPrice: Number(l.unitPrice),
    })),
    subtotalUsd: subtotal,
    shippingUsd: shipping,
    savingsUsd: discount,
    totalUsd: total,
    totalCents: Math.round(total * 100),
    address: {
      label: addr.label ?? '',
      line1: addr.line1 ?? '',
      city: addr.city ?? '',
      phone: addr.phone ?? '',
    },
    addressLabel: addr.label ?? '',
    deliverySlotAr: 'غداً، الصباح',
    deliverySlotEn: 'Tomorrow, Morning',
    paymentMethod: (row.paymentMethod as 'cod' | 'card' | 'bank') ?? 'cod',
  }
}

async function resolveShippingFee(subtotal: number): Promise<number> {
  const zones = await db
    .select()
    .from(deliveryZone)
    .where(eq(deliveryZone.active, true))
    .orderBy(asc(deliveryZone.createdAt))
    .limit(1)
  const zone = zones[0]
  if (zone) {
    const freeOver = Number(zone.freeOverAmount ?? 0)
    const fee = Number(zone.shippingFee)
    return subtotal >= freeOver ? 0 : fee
  }
  return subtotal >= SHIPPING.freeOverUsd ? 0 : SHIPPING.flatUsd
}

async function loadOrderForUser(id: string, userId: string): Promise<Order | null> {
  const rows = await db
    .select()
    .from(order)
    .where(and(eq(order.id, id), eq(order.userId, userId)))
    .limit(1)
  if (!rows.length) return null
  const [lines, events] = await Promise.all([
    db.select().from(orderLine).where(eq(orderLine.orderId, id)),
    db.select().from(orderEvent).where(eq(orderEvent.orderId, id)).orderBy(desc(orderEvent.createdAt)),
  ])
  return mapOrder(rows[0], lines, events)
}

export async function getOrders(actor?: Actor): Promise<Order[]> {
  const userId = (await resolveActor(actor)).id

  const orders = await db
    .select()
    .from(order)
    .where(eq(order.userId, userId))
    .orderBy(desc(order.createdAt))

  if (!orders.length) return []

  const orderIds = orders.map((o) => o.id)
  const [lines, events] = await Promise.all([
    db.select().from(orderLine).where(inArray(orderLine.orderId, orderIds)),
    db.select().from(orderEvent).where(inArray(orderEvent.orderId, orderIds)),
  ])

  return orders.map((o) =>
    mapOrder(
      o,
      lines.filter((l) => l.orderId === o.id),
      events.filter((e) => e.orderId === o.id),
    ),
  )
}

export async function getOrderById(id: string, actor?: Actor): Promise<Order | null> {
  const userId = (await resolveActor(actor)).id
  return loadOrderForUser(id, userId)
}

export async function createOrder(
  params: {
    lines: { productId: string; qty: number; variantId?: string }[]
    address: { label: string; line1?: string; city?: string; phone?: string }
    paymentMethod: string
  },
  actor?: Actor,
): Promise<Order> {
  const { id: userId, role } = await resolveActor(actor)

  const MAX_LINES = 100
  const MAX_QTY = 100_000
  if (!Array.isArray(params.lines) || !params.lines.length) throw new ValidationError('السلة فارغة')
  if (params.lines.length > MAX_LINES) throw new ValidationError(`عدد أصناف الطلب كبير جداً (الحد ${MAX_LINES})`)

  const PAYMENT_METHODS = ['cod', 'card', 'bank'] as const
  if (!(PAYMENT_METHODS as readonly string[]).includes(params.paymentMethod)) {
    throw new ValidationError(`طريقة دفع غير صالحة. المسموح: ${PAYMENT_METHODS.join(', ')}`)
  }
  const paymentMethod = params.paymentMethod as (typeof PAYMENT_METHODS)[number]

  // Preserve variantId per line — don't merge across variants of the same product
  const cleanLines: { productId: string; qty: number; variantId?: string }[] = []
  const seen = new Map<string, number>() // key -> index in cleanLines
  for (const l of params.lines) {
    const productId = String(l.productId ?? '').trim()
    const variantId = l.variantId ? String(l.variantId).trim() : undefined
    const qty = Math.max(1, Math.trunc(Number(l.qty) || 0))
    if (!productId || qty <= 0) continue
    const key = `${productId}::${variantId ?? ''}`
    if (seen.has(key)) {
      const idx = seen.get(key)!
      cleanLines[idx].qty = Math.min(MAX_QTY, cleanLines[idx].qty + qty)
    } else {
      seen.set(key, cleanLines.length)
      cleanLines.push({ productId, qty: Math.min(MAX_QTY, qty), variantId })
    }
  }
  if (!cleanLines.length) throw new ValidationError('لا توجد أصناف صالحة في الطلب')

  const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)
  const phoneRaw = clip(params.address?.phone, 20)
  if (phoneRaw && !/^\+?[0-9]{7,20}$/.test(phoneRaw)) {
    throw new ValidationError('رقم هاتف غير صالح')
  }
  const address = {
    label: clip(params.address?.label, 60) || 'الرئيسي',
    line1: clip(params.address?.line1, 200),
    city: clip(params.address?.city, 80),
    phone: phoneRaw,
  }

  // Separate lines that use a variant from those that use tier-based pricing
  const variantLines = cleanLines.filter((l) => l.variantId)
  const tierLines = cleanLines.filter((l) => !l.variantId)

  // Resolve tier-based prices (existing logic)
  const tierPriced = await priceLinesUsd(
    tierLines.map((l) => ({ productId: l.productId, qty: l.qty })),
    role,
  )

  // Resolve variant prices from DB — never trust client
  const variantIds = variantLines.map((l) => l.variantId!).filter(Boolean)
  const variantRows = variantIds.length
    ? await db
        .select({ id: productVariant.id, price: productVariant.price, stock: productVariant.stock, active: productVariant.active, options: productVariant.options })
        .from(productVariant)
        .where(inArray(productVariant.id, variantIds))
    : []
  const variantMap = Object.fromEntries(variantRows.map((v) => [v.id, v]))

  const variantPriced = variantLines.map((l) => {
    const v = variantMap[l.variantId!]
    if (!v || !v.active) throw new ValidationError('أحد المتغيرات غير متاح')
    if (v.stock < l.qty) throw new ValidationError('الكمية غير متوفرة لهذا المتغير')
    return { ...l, unitPrice: Number(v.price), variantOptions: v.options as Record<string, string> }
  })

  const pricedLines = [
    ...tierPriced.map((l, i) => ({ ...l, variantId: undefined as string | undefined, variantOptions: {} as Record<string, string> })),
    ...variantPriced,
  ]

  const productIds = [...new Set(pricedLines.map((l) => l.productId).filter(Boolean))]

  const orderId = crypto.randomUUID()
  const ref = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

  await db.transaction(async (tx) => {
    const dbProducts = productIds.length
      ? await tx
          .select({
            id: productTable.id,
            name: productTable.name,
            nameAr: productTable.nameAr,
            imageUrl: productTable.imageUrl,
            unitsPerCarton: productTable.unitsPerCarton,
            stock: productTable.stock,
          })
          .from(productTable)
          .where(inArray(productTable.id, productIds))
      : []

    const productMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]))

    for (const line of pricedLines) {
      const p = productMap[line.productId]
      if (!p) throw new ValidationError('أحد المنتجات غير متاح')

      if (line.variantId) {
        // Deduct stock from variant row atomically
        const updated = await tx
          .update(productVariant)
          .set({ stock: sql`${productVariant.stock} - ${line.qty}`, updatedAt: new Date() })
          .where(and(eq(productVariant.id, line.variantId), gte(productVariant.stock, line.qty)))
          .returning({ id: productVariant.id })
        if (!updated.length) throw new ValidationError(`الكمية غير متوفرة للمتغير: ${p.nameAr ?? p.name}`)
      } else {
        if (p.stock < line.qty) throw new ValidationError(`الكمية غير متوفرة للمنتج: ${p.nameAr ?? p.name}`)
        const updated = await tx
          .update(productTable)
          .set({ stock: sql`${productTable.stock} - ${line.qty}`, updatedAt: new Date() })
          .where(and(eq(productTable.id, line.productId), gte(productTable.stock, line.qty)))
          .returning({ id: productTable.id })
        if (!updated.length) throw new ValidationError(`الكمية غير متوفرة للمنتج: ${p.nameAr ?? p.name}`)
      }
    }

    const subtotal = pricedLines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    const shipping = await resolveShippingFee(subtotal)
    const total = subtotal + shipping

    await tx.insert(order).values({
      id: orderId,
      ref,
      userId,
      status: 'pending',
      paymentMethod,
      shippingAddress: address,
      subtotal: subtotal.toFixed(2),
      shippingFee: shipping.toFixed(2),
      discount: '0',
      total: total.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (pricedLines.length > 0) {
      await tx.insert(orderLine).values(
        pricedLines.map((l) => {
          const p = productMap[l.productId]
          const unitsPerCarton = p?.unitsPerCarton ?? 1
          return {
            id: crypto.randomUUID(),
            orderId,
            productId: l.productId,
            productName: p?.nameAr ?? p?.name ?? l.productId,
            productImage: p?.imageUrl ?? null,
            variantId: l.variantId ?? null,
            variantOptions: l.variantOptions ?? {},
            qty: l.qty,
            unitPrice: l.unitPrice.toFixed(2),
            cartonQty: Math.ceil(l.qty / unitsPerCarton),
            unitsPerCarton,
            subtotal: (l.qty * l.unitPrice).toFixed(2),
          }
        }),
      )
    }

    await tx.insert(orderEvent).values({
      id: crypto.randomUUID(),
      orderId,
      status: 'pending',
      note: 'تم إنشاء الطلب',
      createdBy: userId,
      createdAt: new Date(),
    })
  })

  await writeAuditLog({
    userId,
    action: 'order.create',
    entity: 'order',
    entityId: orderId,
  })

  const result = await loadOrderForUser(orderId, userId)
  return result!
}

export async function cancelOrder(id: string, actor?: Actor): Promise<void> {
  const userId = (await resolveActor(actor)).id

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(order)
      .where(and(eq(order.id, id), eq(order.userId, userId)))
      .limit(1)

    if (!rows.length) throw new NotFoundError('الطلب غير موجود')
    if (NON_CANCELLABLE.includes(rows[0].status as OrderStatus)) {
      throw new ValidationError('لا يمكن إلغاء طلب تم شحنه')
    }
    if (rows[0].status === 'cancelled') return

    const updated = await tx
      .update(order)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(order.id, id),
          notInArray(order.status, [...NON_CANCELLABLE, 'cancelled']),
        ),
      )
      .returning({ id: order.id })

    if (!updated.length) throw new ValidationError('لا يمكن إلغاء هذا الطلب')

    const lines = await tx.select().from(orderLine).where(eq(orderLine.orderId, id))
    for (const line of lines) {
      if (!line.productId) continue
      await tx
        .update(productTable)
        .set({ stock: sql`${productTable.stock} + ${line.qty}`, updatedAt: new Date() })
        .where(eq(productTable.id, line.productId))
    }

    await tx.insert(orderEvent).values({
      id: crypto.randomUUID(),
      orderId: id,
      status: 'cancelled',
      note: 'تم إلغاء الطلب',
      createdBy: userId,
      createdAt: new Date(),
    })
  })

  await writeAuditLog({
    userId,
    action: 'order.cancel',
    entity: 'order',
    entityId: id,
  })
}

export async function getProductPriceTiers(productId: string) {
  return db
    .select()
    .from(priceTier)
    .where(eq(priceTier.productId, productId))
    .orderBy(asc(priceTier.sortOrder))
}
