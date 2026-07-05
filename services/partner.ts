/**
 * services/partner.ts — Supplier / partner seller portal (بوابة الشركاء والموردين).
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  user,
  supplier,
  product as productTable,
  priceTier,
  order,
  orderLine,
  orderEvent,
  kycApproval,
  payout as payoutTable,
  category,
  sellerEarning,
} from '@/lib/db/schema'
import { eq, desc, and, inArray, asc, sum, count } from 'drizzle-orm'
import { getSystemSettings } from '@/lib/settings'
import { resolveActor, type Actor } from '@/lib/actor'
import { ValidationError, NotFoundError } from '@/lib/errors'

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)

export async function getPartnerSupplier(actor?: Actor) {
  const resolved = await resolveActor(actor)
  // الأدمن أثناء "الدخول كمتجر": نجلب المورّد المستهدف مباشرةً بمعرّفه.
  if (resolved.impersonatedSupplierId) {
    const [row] = await db.select().from(supplier).where(eq(supplier.id, resolved.impersonatedSupplierId)).limit(1)
    return row ?? null
  }
  const [row] = await db.select().from(supplier).where(eq(supplier.userId, resolved.id)).limit(1)
  return row ?? null
}

export async function onboardPartner(
  data: { company: string; phone?: string; crNumber?: string },
  actor?: Actor,
) {
  const userId = (await resolveActor(actor)).id
  const company = clip(data.company, 120)
  if (!company) throw new ValidationError('اسم الشركة مطلوب')

  const existing = await getPartnerSupplier(actor)
  if (existing) return existing

  return db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        role: 'supplier',
        company,
        phone: data.phone ? clip(data.phone, 20) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))

    const [sup] = await tx
      .insert(supplier)
      .values({
        id: crypto.randomUUID(),
        name: company,
        nameAr: company,
        country: 'SA',
        verified: false,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    await tx.insert(kycApproval).values({
      id: crypto.randomUUID(),
      userId,
      type: 'supplier',
      status: 'pending',
      crNumber: data.crNumber ? clip(data.crNumber, 30) : null,
      documents: [],
      submittedAt: new Date(),
    })

    return sup
  })
}

export async function getPartnerDashboard(actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('لم يتم ربط حسابك بمتجر مورد')

  const products = await db
    .select({ id: productTable.id, active: productTable.active })
    .from(productTable)
    .where(eq(productTable.supplierId, sup.id))

  const productIds = products.map((p) => p.id)
  let orderCount = 0
  let revenue = 0

  if (productIds.length) {
    const lines = await db
      .select({
        orderId: orderLine.orderId,
        qty: orderLine.qty,
        unitPrice: orderLine.unitPrice,
      })
      .from(orderLine)
      .where(inArray(orderLine.productId, productIds))

    const orderIds = [...new Set(lines.map((l) => l.orderId))]
    orderCount = orderIds.length
    revenue = lines.reduce((s, l) => s + l.qty * Number(l.unitPrice), 0)
  }

  const payouts = await db
    .select({ amount: payoutTable.amount, status: payoutTable.status })
    .from(payoutTable)
    .where(eq(payoutTable.supplierId, sup.id))

  return {
    store: {
      id: sup.id,
      name: sup.nameAr ?? sup.name,
      nameEn: sup.name,
      city: sup.city ?? '',
      country: sup.country,
      logo: sup.logo ?? '',
      verified: sup.verified,
      rating: Number(sup.rating),
      minOrder: sup.minOrder,
      responseTime: sup.responseTime ?? '',
    },
    kpi: {
      products: products.length,
      activeProducts: products.filter((p) => p.active).length,
      orders: orderCount,
      revenue,
      pendingPayouts: payouts.filter((p) => p.status === 'pending').length,
    },
  }
}

export async function getPartnerProducts(actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) return []

  const rows = await db
    .select()
    .from(productTable)
    .where(eq(productTable.supplierId, sup.id))
    .orderBy(desc(productTable.createdAt))
    .limit(200)

  return rows.map((p) => ({
    id: p.id,
    name: p.nameAr ?? p.name,
    nameEn: p.name,
    description: p.descriptionAr ?? p.description ?? '',
    descriptionEn: p.description ?? '',
    sku: p.sku ?? '',
    active: p.active,
    stock: p.stock,
    price: Number(p.marketAvgPrice ?? 0),
    image: p.imageUrl ?? '/placeholder.png',
    unitsPerCarton: p.unitsPerCarton,
    categoryId: p.categoryId ?? '',
    status: p.status,
  }))
}

export async function getPartnerProduct(id: string, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const [row] = await db
    .select()
    .from(productTable)
    .where(and(eq(productTable.id, id), eq(productTable.supplierId, sup.id)))
    .limit(1)

  if (!row) throw new NotFoundError('المنتج غير موجود')

  const tiers = await db.select().from(priceTier).where(eq(priceTier.productId, row.id)).orderBy(asc(priceTier.minQty))

  return {
    id: row.id,
    name: row.nameAr ?? row.name,
    nameEn: row.name,
    description: row.descriptionAr ?? '',
    descriptionEn: row.description ?? '',
    sku: row.sku ?? '',
    active: row.active,
    stock: row.stock,
    price: Number(tiers[0]?.price ?? row.marketAvgPrice ?? 0),
    image: row.imageUrl ?? '/placeholder.png',
    unitsPerCarton: row.unitsPerCarton,
    categoryId: row.categoryId ?? '',
  }
}

export type PartnerProductInput = {
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  sku?: string
  stock?: number
  price?: number
  image?: string
  unitsPerCarton?: number
  categoryId?: string
  active?: boolean
}

export async function createPartnerProduct(data: PartnerProductInput, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const nameAr = clip(data.name, 200)
  const nameEn = clip(data.nameEn ?? data.name, 200)
  if (!nameAr) throw new ValidationError('اسم المنتج مطلوب')

  const productId = crypto.randomUUID()
  const price = Math.max(0, Number(data.price) || 0)
  const stock = Math.max(0, Math.trunc(Number(data.stock) || 0))

  const settings = await getSystemSettings()
  const needsApproval = settings.productApprovalRequired
  const initialStatus = needsApproval ? 'pending_approval' : 'approved'
  const initialActive = needsApproval ? false : (data.active ?? true)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(productTable)
      .values({
        id: productId,
        sku: data.sku ? clip(data.sku, 40) : `SKU-${productId.slice(0, 8)}`,
        name: nameEn,
        nameAr,
        description: clip(data.descriptionEn, 2000),
        descriptionAr: clip(data.description, 2000),
        categoryId: data.categoryId || null,
        supplierId: sup.id,
        imageUrl: clip(data.image, 500) || '/placeholder.png',
        unitsPerCarton: Math.max(1, Math.trunc(Number(data.unitsPerCarton) || 1)),
        marketAvgPrice: price.toFixed(2),
        stock,
        active: initialActive,
        status: initialStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    if (price > 0) {
      await tx.insert(priceTier).values({
        id: crypto.randomUUID(),
        productId,
        minQty: 1,
        price: price.toFixed(2),
        sortOrder: 0,
      })
    }

    return row
  })
}

export async function updatePartnerProduct(id: string, data: PartnerProductInput, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const price = data.price !== undefined ? Math.max(0, Number(data.price) || 0) : undefined

  const [row] = await db
    .update(productTable)
    .set({
      ...(data.name !== undefined ? { nameAr: clip(data.name, 200) } : {}),
      ...(data.nameEn !== undefined ? { name: clip(data.nameEn, 200) } : {}),
      ...(data.description !== undefined ? { descriptionAr: clip(data.description, 2000) } : {}),
      ...(data.descriptionEn !== undefined ? { description: clip(data.descriptionEn, 2000) } : {}),
      ...(data.sku !== undefined ? { sku: clip(data.sku, 40) } : {}),
      ...(data.stock !== undefined ? { stock: Math.max(0, Math.trunc(Number(data.stock) || 0)) } : {}),
      ...(data.image !== undefined ? { imageUrl: clip(data.image, 500) } : {}),
      ...(data.unitsPerCarton !== undefined ? { unitsPerCarton: Math.max(1, Math.trunc(Number(data.unitsPerCarton) || 1)) } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(price !== undefined ? { marketAvgPrice: price.toFixed(2) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(productTable.id, id), eq(productTable.supplierId, sup.id)))
    .returning()

  if (!row) throw new NotFoundError('المنتج غير موجود')

  if (price !== undefined) {
    const existing = await db.select().from(priceTier).where(eq(priceTier.productId, id)).limit(1)
    if (existing.length) {
      await db.update(priceTier).set({ price: price.toFixed(2) }).where(eq(priceTier.id, existing[0].id))
    } else if (price > 0) {
      await db.insert(priceTier).values({
        id: crypto.randomUUID(),
        productId: id,
        minQty: 1,
        price: price.toFixed(2),
        sortOrder: 0,
      })
    }
  }

  return row
}

export async function deletePartnerProduct(id: string, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const deleted = await db
    .delete(productTable)
    .where(and(eq(productTable.id, id), eq(productTable.supplierId, sup.id)))
    .returning({ id: productTable.id })

  if (!deleted.length) throw new NotFoundError('المنتج غير موجود')
}

export async function updatePartnerStore(
  data: Partial<{ name: string; nameEn: string; city: string; country: string; logo: string; minOrder: number; responseTime: string }>,
  actor?: Actor,
) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const [row] = await db
    .update(supplier)
    .set({
      ...(data.name !== undefined ? { nameAr: clip(data.name, 120) } : {}),
      ...(data.nameEn !== undefined ? { name: clip(data.nameEn, 120) } : {}),
      ...(data.city !== undefined ? { city: clip(data.city, 80) } : {}),
      ...(data.country !== undefined ? { country: clip(data.country, 4) || 'SA' } : {}),
      ...(data.logo !== undefined ? { logo: clip(data.logo, 500) } : {}),
      ...(data.minOrder !== undefined ? { minOrder: Math.max(1, Math.trunc(Number(data.minOrder) || 1)) } : {}),
      ...(data.responseTime !== undefined ? { responseTime: clip(data.responseTime, 40) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supplier.id, sup.id))
    .returning()

  return row
}

export async function getPartnerCategories() {
  const rows = await db.select({ id: category.id, name: category.nameAr, slug: category.slug }).from(category).orderBy(asc(category.sortOrder))
  return rows
}

export async function getPartnerOrderDetail(orderId: string, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const productIds = (
    await db.select({ id: productTable.id }).from(productTable).where(eq(productTable.supplierId, sup.id))
  ).map((p) => p.id)

  const [orderRow] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
  if (!orderRow) throw new NotFoundError('الطلب غير موجود')

  const lines = await db
    .select()
    .from(orderLine)
    .where(and(eq(orderLine.orderId, orderId), inArray(orderLine.productId, productIds)))

  if (!lines.length) throw new NotFoundError('لا توجد منتجات لك في هذا الطلب')

  const events = await db
    .select()
    .from(orderEvent)
    .where(eq(orderEvent.orderId, orderId))
    .orderBy(desc(orderEvent.createdAt))

  const addr = (orderRow.shippingAddress as { label?: string; line1?: string; city?: string; phone?: string } | null) ?? {}

  return {
    id: orderRow.id,
    ref: orderRow.ref,
    status: orderRow.status,
    paymentMethod: orderRow.paymentMethod,
    paymentStatus: orderRow.paymentStatus,
    createdAt: orderRow.createdAt.toISOString(),
    address: {
      label: addr.label ?? '',
      line1: addr.line1 ?? '',
      city: addr.city ?? '',
      phone: addr.phone ?? '',
    },
    lines: lines.map((l) => ({
      id: l.id,
      productName: l.productName,
      qty: l.qty,
      unitPrice: Number(l.unitPrice),
      subtotal: Number(l.subtotal),
      image: l.productImage,
    })),
    total: lines.reduce((s, l) => s + Number(l.subtotal), 0),
    timeline: events.map((e) => ({
      status: e.status,
      note: e.note ?? '',
      at: e.createdAt.toISOString(),
    })),
  }
}

export async function getPartnerInvoiceDetail(invoiceId: string, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const [row] = await db
    .select()
    .from(payoutTable)
    .where(and(eq(payoutTable.id, invoiceId), eq(payoutTable.supplierId, sup.id)))
    .limit(1)

  if (!row) throw new NotFoundError('الفاتورة غير موجودة')

  return {
    id: row.id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    reference: row.reference ?? row.id.slice(0, 8).toUpperCase(),
    createdAt: row.createdAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    supplierName: sup.nameAr ?? sup.name,
    bankAccount: row.bankAccount,
  }
}

export async function getPartnerOrders(actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) return []

  const productIds = (
    await db.select({ id: productTable.id }).from(productTable).where(eq(productTable.supplierId, sup.id))
  ).map((p) => p.id)

  if (!productIds.length) return []

  const lines = await db
    .select()
    .from(orderLine)
    .where(inArray(orderLine.productId, productIds))
    .limit(500)

  const orderIds = [...new Set(lines.map((l) => l.orderId))]
  if (!orderIds.length) return []

  const orders = await db
    .select()
    .from(order)
    .where(inArray(order.id, orderIds))
    .orderBy(desc(order.createdAt))
    .limit(100)

  return orders.map((o) => {
    const oLines = lines.filter((l) => l.orderId === o.id)
    const total = oLines.reduce((s, l) => s + l.qty * Number(l.unitPrice), 0)
    return {
      id: o.id,
      ref: o.ref,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      items: oLines.length,
      total,
    }
  })
}

export async function getPartnerInvoices(actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) return []

  const rows = await db
    .select()
    .from(payoutTable)
    .where(eq(payoutTable.supplierId, sup.id))
    .orderBy(desc(payoutTable.createdAt))
    .limit(50)

  return rows.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    reference: p.reference ?? '',
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function updatePartnerProductStatus(productId: string, active: boolean, actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const [row] = await db
    .update(productTable)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(productTable.id, productId), eq(productTable.supplierId, sup.id)))
    .returning()

  if (!row) throw new NotFoundError('المنتج غير موجود')
  return row
}

// ── Earnings & Withdrawals ────────────────────────────────────────────────

/** Calculates the partner's available / pending balance from earnings and payouts. */
export async function getPartnerEarnings(actor?: Actor) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')

  const [earningsAgg] = await db
    .select({
      totalGross:      sum(sellerEarning.grossAmount),
      totalCommission: sum(sellerEarning.commissionAmount),
      totalNet:        sum(sellerEarning.netEarning),
    })
    .from(sellerEarning)
    .where(eq(sellerEarning.supplierId, sup.id))

  const [settledAgg] = await db
    .select({ settled: sum(sellerEarning.netEarning) })
    .from(sellerEarning)
    .where(and(eq(sellerEarning.supplierId, sup.id), eq(sellerEarning.status, 'settled')))

  const [payoutsAgg] = await db
    .select({ paid: sum(payoutTable.amount) })
    .from(payoutTable)
    .where(and(eq(payoutTable.supplierId, sup.id), eq(payoutTable.status, 'completed')))

  const totalNet    = Number(earningsAgg?.totalNet ?? 0)
  const totalPaid   = Number(payoutsAgg?.paid ?? 0)
  const available   = Math.max(0, totalNet - totalPaid)

  const recentEarnings = await db
    .select()
    .from(sellerEarning)
    .where(eq(sellerEarning.supplierId, sup.id))
    .orderBy(desc(sellerEarning.createdAt))
    .limit(20)

  const withdrawals = await db
    .select()
    .from(payoutTable)
    .where(eq(payoutTable.supplierId, sup.id))
    .orderBy(desc(payoutTable.createdAt))
    .limit(20)

  return {
    kpi: {
      totalGross:      Number(earningsAgg?.totalGross ?? 0),
      totalCommission: Number(earningsAgg?.totalCommission ?? 0),
      totalNet,
      available,
      paid: totalPaid,
    },
    earnings: recentEarnings.map((e) => ({
      id:               e.id,
      orderId:          e.orderId,
      grossAmount:      Number(e.grossAmount),
      commissionRate:   Number(e.commissionRate),
      commissionAmount: Number(e.commissionAmount),
      netEarning:       Number(e.netEarning),
      status:           e.status,
      createdAt:        e.createdAt.toISOString(),
    })),
    withdrawals: withdrawals.map((p) => ({
      id:          p.id,
      amount:      Number(p.amount),
      currency:    p.currency,
      status:      p.status,
      reference:   p.reference ?? '',
      bankAccount: p.bankAccount as Record<string, string> | null,
      createdAt:   p.createdAt.toISOString(),
    })),
  }
}

/** Request a withdrawal (creates a payout row with status=pending). */
export async function requestWithdrawal(
  data: { amount: number; bankName: string; iban: string; note?: string },
  actor?: Actor,
) {
  const sup = await getPartnerSupplier(actor)
  if (!sup) throw new NotFoundError('المورد غير موجود')
  if (data.amount <= 0) throw new ValidationError('المبلغ يجب أن يكون أكبر من صفر')

  const row = await db.transaction(async (tx) => {
    // Re-read balance inside the transaction to prevent TOCTOU race
    const [netAgg] = await tx
      .select({ totalNet: sum(sellerEarning.netEarning) })
      .from(sellerEarning)
      .where(eq(sellerEarning.supplierId, sup.id))

    const [paidAgg] = await tx
      .select({ paid: sum(payoutTable.amount) })
      .from(payoutTable)
      .where(and(eq(payoutTable.supplierId, sup.id), eq(payoutTable.status, 'completed')))

    const available = Math.max(0, Number(netAgg?.totalNet ?? 0) - Number(paidAgg?.paid ?? 0))
    if (data.amount > available) {
      throw new ValidationError(`الرصيد المتاح (${available.toFixed(2)}) أقل من المبلغ المطلوب`)
    }

    const [inserted] = await tx
      .insert(payoutTable)
      .values({
        id:          crypto.randomUUID(),
        supplierId:  sup.id,
        amount:      String(data.amount),
        currency:    'SAR',
        status:      'pending',
        bankAccount: { bankName: data.bankName, iban: data.iban, note: data.note ?? '' },
        createdAt:   new Date(),
      })
      .returning()
    return inserted
  })

  return row
}

// ── Commission calculation (called when order is marked delivered) ─────────

/**
 * Calculates and records seller earnings when an order reaches `delivered` status.
 * Safe to call multiple times — skips if earning already exists for this order.
 */
export async function recordSellerEarning(orderId: string) {
  // Skip if already recorded
  const existing = await db
    .select({ id: sellerEarning.id })
    .from(sellerEarning)
    .where(eq(sellerEarning.orderId, orderId))
    .limit(1)

  if (existing.length) return null

  const [orderRow] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1)

  if (!orderRow?.supplierId) return null

  const settings = await getSystemSettings()
  const commissionRate = settings.defaultCommissionRate

  // Find if this supplier has a custom commission rate (from their row in DB)
  // For now use the global default; extend later for per-supplier rates
  const gross = Number(orderRow.total)
  const commissionAmount = (gross * commissionRate) / 100
  const netEarning = gross - commissionAmount

  const [earning] = await db
    .insert(sellerEarning)
    .values({
      id:               crypto.randomUUID(),
      supplierId:       orderRow.supplierId,
      orderId,
      grossAmount:      String(gross),
      commissionRate:   String(commissionRate),
      commissionAmount: String(commissionAmount),
      netEarning:       String(netEarning),
      status:           'pending',
      createdAt:        new Date(),
    })
    .returning()

  return earning
}
