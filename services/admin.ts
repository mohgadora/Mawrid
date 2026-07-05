/**
 * services/admin.ts — Admin data layer backed 100% by Neon/Drizzle.
 * KPIs, orders, suppliers, buyers, tickets, finance, and geography
 * all read live from the database. Mock data is no longer used.
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  user,
  order,
  orderLine,
  supplier,
  product as productTable,
  supportTicket,
  kycApproval,
  payout as payoutTable,
  transaction as transactionTable,
  auditLog as auditLogTable,
  deliveryZone,
  country as countryTable,
  driver as driverTable,
  session as sessionTable,
} from '@/lib/db/schema'
import { eq, sql, count, sum, desc, and, gte, lt, ne, asc, inArray } from 'drizzle-orm'
import type { OrderStatus } from '@/lib/order-types'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

// ── Shared types ──────────────────────────────────────────────────────────

export type ApprovalType    = 'kyc' | 'supplier' | 'product' | 'promotion' | 'review' | 'refund' | 'price'
export type ApprovalStatus  = 'pending' | 'approved' | 'rejected'
export type ApprovalCategory = 'kyc' | 'supplier' | 'product' | 'promotion' | 'review' | 'refund' | 'price'
export type ApprovalPriority = 'high' | 'medium' | 'low'
export type SupplierStatus  = 'active' | 'pending' | 'suspended'
export type TicketStatus    = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority  = 'urgent' | 'high' | 'medium' | 'low'

export type Approval = {
  id: string
  type: ApprovalType
  title: string
  subtitle: string
  submittedAt: string
  status: ApprovalStatus
  priority: 'high' | 'medium' | 'low'
}

export type AdminOrder = {
  id: string
  buyer: string
  supplier: string
  amount: number
  items: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  date: string
}

// ── KPI — computed live from DB ───────────────────────────────────────────

export async function getAdminKpi() {
  const now              = new Date()
  const thisMonthStart   = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const sixMonthsAgo     = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalOrdersRow,
    totalSuppliersRow,
    totalBuyersRow,
    pendingApprovalsRow,
    openTicketsRow,
    thisMonthRevenueRow,
    lastMonthRevenueRow,
    pendingOrdersRow,
    revenueByMonth,
  ] = await Promise.all([
    db.select({ count: count() }).from(order),
    db.select({ count: count() }).from(supplier),
    db.select({ count: count() }).from(user).where(ne(user.role, 'admin')),
    db.select({ count: count() }).from(kycApproval).where(eq(kycApproval.status, 'pending')),
    db.select({ count: count() }).from(supportTicket).where(eq(supportTicket.status, 'open')),
    db.select({ total: sum(order.total) }).from(order).where(
      and(gte(order.createdAt, thisMonthStart), ne(order.status, 'cancelled')),
    ),
    db.select({ total: sum(order.total) }).from(order).where(
      and(
        gte(order.createdAt, lastMonthStart),
        lt(order.createdAt, thisMonthStart),
        ne(order.status, 'cancelled'),
      ),
    ),
    db.select({ count: count() }).from(order).where(eq(order.status, 'pending')),
    db
      .select({
        month: sql<string>`to_char("createdAt", 'YYYY-MM')`,
        value: sum(order.total),
      })
      .from(order)
      .where(and(gte(order.createdAt, sixMonthsAgo), ne(order.status, 'cancelled')))
      .groupBy(sql`to_char("createdAt", 'YYYY-MM')`)
      .orderBy(sql`to_char("createdAt", 'YYYY-MM')`),
  ])

  const thisMonthRevenue = Number(thisMonthRevenueRow[0]?.total ?? 0)
  const lastMonthRevenue = Number(lastMonthRevenueRow[0]?.total ?? 0)
  const revenueGrowth    = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10
    : 0

  const kpi = {
    gmv:              thisMonthRevenue,
    gmvGrowth:        revenueGrowth,
    orders:           totalOrdersRow[0]?.count ?? 0,
    ordersGrowth:     0,
    suppliers:        totalSuppliersRow[0]?.count ?? 0,
    suppliersGrowth:  0,
    buyers:           totalBuyersRow[0]?.count ?? 0,
    buyersGrowth:     0,
    pendingApprovals: pendingApprovalsRow[0]?.count ?? 0,
    openTickets:      openTicketsRow[0]?.count ?? 0,
    revenue:          thisMonthRevenue,
    revenueGrowth,
    pendingOrders:    pendingOrdersRow[0]?.count ?? 0,
  }

  const chart = revenueByMonth.map((r) => ({
    month: r.month,
    value: Number(r.value ?? 0),
  }))

  return { kpi, chart }
}

// ── Approvals ─────────────────────────────────────────────────────────────

export async function getApprovals() {
  const rows = await db
    .select()
    .from(kycApproval)
    .orderBy(desc(kycApproval.submittedAt))
    .limit(100)

  const userIds  = [...new Set(rows.map((r) => r.userId))]
  const userRows = userIds.length
    ? await db.select({ id: user.id, name: user.name }).from(user)
    : []
  const userMap  = Object.fromEntries(userRows.map((u) => [u.id, u.name]))

  return rows.map((r) => ({
    id:          r.id,
    type:        'kyc' as ApprovalCategory,
    title:       userMap[r.userId] ?? r.userId,
    subtitle:    `KYC — ${r.crNumber ?? 'CR غير محدد'}`,
    submittedAt: r.submittedAt.toISOString(),
    status:      r.status,
    priority:    'high' as ApprovalPriority,
    crNumber:    r.crNumber ?? '',
    vatNumber:   r.vatNumber ?? '',
    documents:   (r.documents as unknown[]) ?? [],
    userId:      r.userId,
  }))
}

export async function updateApprovalStatus(id: string, status: string, adminUserId?: string) {
  const [row] = await db
    .update(kycApproval)
    .set({ status, reviewedAt: new Date() })
    .where(eq(kycApproval.id, id))
    .returning()
  if (!row) throw new NotFoundError('Approval not found')

  if (status === 'approved') {
    await db
      .update(user)
      .set({ role: 'merchant', updatedAt: new Date() })
      .where(eq(user.id, row.userId))
  } else if (status === 'rejected') {
    await db
      .update(user)
      .set({ role: 'consumer', updatedAt: new Date() })
      .where(and(eq(user.id, row.userId), eq(user.role, 'merchant')))
  }

  await writeAuditLog({
    userId: adminUserId ?? null,
    action: `kyc.${status}`,
    entity: 'kyc_approval',
    entityId: id,
    meta: { userId: row.userId },
  })

  return row
}

// ── Orders (admin view) ────────────────────────────────────────────────────

export async function getAdminOrders() {
  const rows = await db
    .select()
    .from(order)
    .orderBy(desc(order.createdAt))
    .limit(200)

  const userRows = await db.select({ id: user.id, name: user.name }).from(user)
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u.name]))

  const supRows = await db.select({ id: supplier.id, name: supplier.name }).from(supplier)
  const supMap = Object.fromEntries(supRows.map((s) => [s.id, s.name]))

  const orderIds = rows.map((o) => o.id)
  const lineCounts = orderIds.length
    ? await db
        .select({ orderId: orderLine.orderId, items: count() })
        .from(orderLine)
        .where(inArray(orderLine.orderId, orderIds))
        .groupBy(orderLine.orderId)
    : []
  const itemsMap = Object.fromEntries(lineCounts.map((r) => [r.orderId, Number(r.items)]))

  return rows.map((o) => ({
    id: o.ref,
    buyer: userMap[o.userId] ?? o.userId,
    supplier: o.supplierId ? (supMap[o.supplierId] ?? '') : '',
    amount: Number(o.total),
    items: itemsMap[o.id] ?? 0,
    status: o.status as OrderStatus,
    date: o.createdAt.toISOString().slice(0, 10),
  }))
}

// ── Suppliers (admin view) ─────────────────────────────────────────────────

export async function getAdminSuppliers() {
  const rows = await db
    .select()
    .from(supplier)
    .orderBy(desc(supplier.createdAt))

  // Count products per supplier in one query
  const productCounts = await db
    .select({ supplierId: productTable.supplierId, count: count() })
    .from(productTable)
    .groupBy(productTable.supplierId)
  const countMap = Object.fromEntries(
    productCounts.map((r) => [r.supplierId, r.count]),
  )

  return rows.map((s) => ({
    id:       s.id,
    name:     s.nameAr ?? s.name,
    nameEn:   s.name,
    category: '',
    products: countMap[s.id] ?? 0,
    orders:   0,
    rating:   Number(s.rating),
    status:   s.verified ? 'active' : 'pending',
    joined:   s.createdAt.toISOString().slice(0, 10),
    logo:     s.logo ?? null,
    city:     s.city ?? '',
    verified: s.verified,
  }))
}

export async function createSupplier(data: {
  name: string
  nameAr?: string
  city?: string
  logo?: string
}) {
  const [row] = await db
    .insert(supplier)
    .values({
      id:        crypto.randomUUID(),
      name:      data.name,
      nameAr:    data.nameAr ?? data.name,
      city:      data.city ?? '',
      logo:      data.logo ?? null,
      country:   'SA',
      rating:    '0',
      verified:  false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return row
}

export async function updateSupplierStatus(id: string, status: string, adminUserId?: string) {
  const verified = status === 'active'
  const [row] = await db
    .update(supplier)
    .set({ verified, updatedAt: new Date() })
    .where(eq(supplier.id, id))
    .returning()
  if (!row) throw new NotFoundError('Supplier not found')

  await writeAuditLog({
    userId: adminUserId ?? null,
    action: `supplier.${status}`,
    entity: 'supplier',
    entityId: id,
  })

  return row
}

// ── Buyers ────────────────────────────────────────────────────────────────

export async function getAdminBuyers() {
  const rows = await db
    .select()
    .from(user)
    .where(ne(user.role, 'admin'))
    .orderBy(desc(user.createdAt))
    .limit(200)

  return rows.map((u) => ({
    id:     u.id,
    name:   u.name,
    email:  u.email,
    type:   u.role === 'merchant' ? 'تاجر' : 'مستهلك',
    orders: 0,
    spend:  0,
    status: 'active',
    joined: u.createdAt.toISOString().slice(0, 10),
  }))
}

// ── Support Tickets ───────────────────────────────────────────────────────

export async function getSupportTickets() {
  const rows = await db
    .select()
    .from(supportTicket)
    .orderBy(desc(supportTicket.createdAt))
    .limit(200)

  const userRows = await db.select({ id: user.id, name: user.name }).from(user)
  const userMap  = Object.fromEntries(userRows.map((u) => [u.id, u.name]))

  return rows.map((t) => ({
    id:       t.ref,
    subject:  t.subject,
    user:     userMap[t.userId] ?? t.userId,
    priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
    status:   t.status,
    created:  t.createdAt.toISOString(),
  }))
}

// ── Finance ───────────────────────────────────────────────────────────────

export async function getPayouts() {
  const rows = await db
    .select()
    .from(payoutTable)
    .orderBy(desc(payoutTable.createdAt))
    .limit(200)

  const supRows  = await db.select({ id: supplier.id, name: supplier.name, nameAr: supplier.nameAr }).from(supplier)
  const supMap   = Object.fromEntries(supRows.map((s) => [s.id, s.nameAr ?? s.name]))

  return rows.map((p) => ({
    id:       p.id,
    supplier: supMap[p.supplierId] ?? p.supplierId,
    amount:   Number(p.amount),
    period:   p.createdAt.toISOString().slice(0, 7),
    status:   p.status,
    date:     p.createdAt.toISOString().slice(0, 10),
  }))
}

export async function getTransactions() {
  const rows = await db
    .select()
    .from(transactionTable)
    .orderBy(desc(transactionTable.createdAt))
    .limit(200)

  const userRows = await db.select({ id: user.id, name: user.name }).from(user)
  const userMap  = Object.fromEntries(userRows.map((u) => [u.id, u.name]))

  return rows.map((t) => ({
    id:     t.id,
    type:   t.type,
    party:  userMap[t.userId] ?? t.userId,
    amount: Number(t.amount),
    fee:    0,
    net:    Number(t.amount),
    status: t.status,
    date:   t.createdAt.toISOString().slice(0, 10),
  }))
}

// ── Roles & RBAC (static — managed in code, not DB) ───────────────────────

export async function getAdminRoles() {
  // أعداد المستخدمين الفعلية لكل دور
  const counts = await db
    .select({ role: user.role, count: count() })
    .from(user)
    .groupBy(user.role)
  const countBy = new Map(counts.map((c) => [c.role, Number(c.count)]))

  return [
    { id: 'admin',    name: 'مدير النظام', nameEn: 'Admin',    description: 'صلاحيات كاملة على النظام',        users: countBy.get('admin') ?? 0,    permissions: ['all'] },
    { id: 'merchant', name: 'تاجر',        nameEn: 'Merchant', description: 'إدارة الطلبات والكتالوج',        users: countBy.get('merchant') ?? 0, permissions: ['orders.read', 'catalog.read'] },
    { id: 'consumer', name: 'مستهلك',      nameEn: 'Consumer', description: 'تصفّح وشراء المنتجات',           users: countBy.get('consumer') ?? 0, permissions: ['orders.read'] },
  ]
}

export type PermissionRow = {
  module: string
  superAdmin: boolean
  opsManager: boolean
  finance: boolean
  support: boolean
  content: boolean
}

export async function getPermissionMatrix(): Promise<PermissionRow[]> {
  return [
    { module: 'الطلبات',    superAdmin: true, opsManager: true,  finance: false, support: true,  content: false },
    { module: 'الكتالوج',   superAdmin: true, opsManager: true,  finance: false, support: false, content: true  },
    { module: 'المالية',    superAdmin: true, opsManager: false, finance: true,  support: false, content: false },
    { module: 'المستخدمون', superAdmin: true, opsManager: false, finance: false, support: true,  content: false },
    { module: 'المحتوى',    superAdmin: true, opsManager: false, finance: false, support: false, content: true  },
    { module: 'الإعدادات',  superAdmin: true, opsManager: false, finance: false, support: false, content: false },
  ]
}

// ── Audit Log ─────────────────────────────────────────────────────────────

export async function getAuditLogs() {
  const rows = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(200)

  return rows.map((r, i) => ({
    id:     r.id ?? String(i + 1),
    user:   r.userId ?? 'System',
    action: r.action,
    target: `${r.entity} #${r.entityId ?? ''}`,
    ip:     r.ip ?? 'unknown',
    at:     r.createdAt.toISOString(),
  }))
}

// ── Geography ─────────────────────────────────────────────────────────────

export async function getDeliveryZones() {
  const rows = await db.select().from(deliveryZone).orderBy(desc(deliveryZone.active), asc(deliveryZone.name))
  return rows.map((z) => ({
    id:       z.id,
    name:     z.nameAr ?? z.name,
    nameEn:   z.name,
    city:     z.name,
    country:  z.country,
    fee:      Number(z.shippingFee),
    minOrder: Number(z.freeOverAmount ?? 0),
    status:   z.active ? 'active' : 'inactive',
  }))
}

export async function upsertDeliveryZone(data: {
  id?: string
  name: string
  nameEn?: string
  city?: string
  country?: string
  fee: number
  minOrder: number
  active: boolean
}) {
  const name = data.name.trim()
  if (!name) throw new ValidationError('اسم المنطقة مطلوب')
  const fee = Math.max(0, Number(data.fee) || 0)
  const minOrder = Math.max(0, Number(data.minOrder) || 0)
  const country = (data.country ?? 'SA').trim().slice(0, 4) || 'SA'
  const city = (data.city ?? name).trim().slice(0, 80) || name

  if (data.id) {
    const [row] = await db
      .update(deliveryZone)
      .set({
        name: data.nameEn?.trim() || name,
        nameAr: name,
        country,
        shippingFee: fee.toFixed(2),
        freeOverAmount: minOrder.toFixed(2),
        active: data.active,
      })
      .where(eq(deliveryZone.id, data.id))
      .returning()
    if (!row) throw new NotFoundError('Delivery zone not found')
    return row
  }

  const [row] = await db
    .insert(deliveryZone)
    .values({
      id: crypto.randomUUID(),
      name: data.nameEn?.trim() || city,
      nameAr: name,
      country,
      shippingFee: fee.toFixed(2),
      freeOverAmount: minOrder.toFixed(2),
      estimatedDays: 3,
      active: data.active,
      createdAt: new Date(),
    })
    .returning()
  return row
}

export async function getAdminCountries() {
  const rows = await db.select().from(countryTable).orderBy(asc(countryTable.name))
  return rows.map((c) => ({
    code:      c.code,
    name:      c.nameAr,
    nameEn:    c.name,
    currency:  c.currency,
    vat:       '',
    enabled:   c.active,
    languages: ['ar', 'en'],
  }))
}

export async function createCountry(data: {
  code: string
  name: string
  nameEn: string
  currency: string
  active?: boolean
}) {
  const code = data.code.trim().toUpperCase().slice(0, 4)
  const nameAr = data.name.trim().slice(0, 80)
  const name = data.nameEn.trim().slice(0, 80)
  const currency = data.currency.trim().toUpperCase().slice(0, 3)
  if (!code || code.length < 2) throw new ValidationError('رمز الدولة مطلوب (حرفان على الأقل)')
  if (!nameAr || !name) throw new ValidationError('اسم الدولة مطلوب')
  if (!currency || currency.length !== 3) throw new ValidationError('رمز العملة يجب أن يكون 3 أحرف')

  const [row] = await db
    .insert(countryTable)
    .values({
      id: crypto.randomUUID(),
      code,
      name,
      nameAr,
      currency,
      active: data.active ?? true,
    })
    .returning()
  return row
}

export async function updateCountry(
  code: string,
  data: Partial<{ name: string; nameEn: string; currency: string; active: boolean }>,
) {
  const countryCode = code.trim().toUpperCase()
  const [row] = await db
    .update(countryTable)
    .set({
      ...(data.name !== undefined ? { nameAr: data.name.trim().slice(0, 80) } : {}),
      ...(data.nameEn !== undefined ? { name: data.nameEn.trim().slice(0, 80) } : {}),
      ...(data.currency !== undefined ? { currency: data.currency.trim().toUpperCase().slice(0, 3) } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    })
    .where(eq(countryTable.code, countryCode))
    .returning()
  if (!row) throw new NotFoundError('Country not found')
  return row
}

// ── Drivers ───────────────────────────────────────────────────────────────

export async function getAdminDrivers() {
  return db.select().from(driverTable).orderBy(desc(driverTable.updatedAt))
}

export async function updateDriverLocation(id: string, lat: number, lng: number, status?: string) {
  const [row] = await db
    .update(driverTable)
    .set({
      lat: lat.toFixed(7),
      lng: lng.toFixed(7),
      ...(status ? { status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(driverTable.id, id))
    .returning({ id: driverTable.id })
  if (!row) throw new NotFoundError('Driver not found')
  return row
}

// ── Products (admin CRUD) ─────────────────────────────────────────────────

export async function getAdminProducts() {
  return db
    .select()
    .from(productTable)
    .orderBy(desc(productTable.createdAt))
    .limit(500)
}

export async function updateProductStatus(id: string, active: boolean) {
  const [row] = await db
    .update(productTable)
    .set({ active, updatedAt: new Date() })
    .where(eq(productTable.id, id))
    .returning()
  if (!row) throw new NotFoundError('Product not found')
  return row
}

// ── Active sessions (Better Auth) ───────────────────────────────────────────

export async function getAdminSessions() {
  const rows = await db
    .select()
    .from(sessionTable)
    .orderBy(desc(sessionTable.createdAt))
    .limit(200)

  const userIds = [...new Set(rows.map((r) => r.userId))]
  const userRows = userIds.length
    ? await db.select({ id: user.id, name: user.name, role: user.role }).from(user).where(inArray(user.id, userIds))
    : []
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u]))

  const now = Date.now()
  return rows.map((r) => {
    const u = userMap[r.userId]
    const ua = r.userAgent ?? ''
    const isMobile = /mobile|android|iphone|ipad/i.test(ua)
    const active = r.expiresAt.getTime() > now
    return {
      sessionId: r.id,
      user:      u?.name ?? r.userId,
      role:      u?.role ?? 'unknown',
      device:    ua.length > 72 ? `${ua.slice(0, 72)}…` : (ua || 'Unknown'),
      type:      isMobile ? 'mobile' : 'desktop',
      ip:        r.ipAddress ?? '',
      location:  '',
      status:    active ? 'active' : 'inactive',
      lastSeen:  r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }
  })
}

export async function revokeAdminSession(sessionId: string, adminUserId?: string) {
  const [row] = await db
    .delete(sessionTable)
    .where(eq(sessionTable.id, sessionId))
    .returning({ id: sessionTable.id })
  if (!row) throw new NotFoundError('Session not found')

  await writeAuditLog({
    userId: adminUserId ?? null,
    action: 'session.revoked',
    entity: 'session',
    entityId: sessionId,
  })

  return { ok: true }
}
