/**
 * services/analytics.ts — Analytics data layer (server-only).
 * All functions query real DB via Drizzle ORM / Neon Postgres.
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  order,
  orderLine,
  product as productTable,
  supplier as supplierTable,
  user,
  payout as payoutTable,
} from '@/lib/db/schema'
import { and, count, desc, eq, gte, inArray, lt, sql, sum } from 'drizzle-orm'

// ── Helpers ───────────────────────────────────────────────────────────────

export type Period = '7d' | '30d' | '90d' | 'all'

function periodDays(period: Exclude<Period, 'all'>): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

const COMPLETED = ['delivered', 'completed'] as const

// ── getRevenueSummary ─────────────────────────────────────────────────────

export async function getRevenueSummary(period: Period) {
  const completedFilter = inArray(order.status, [...COMPLETED])

  const currentWhere =
    period === 'all'
      ? completedFilter
      : and(completedFilter, gte(order.createdAt, daysAgo(periodDays(period))))

  const [cur] = await db
    .select({ totalRevenue: sum(order.total), orderCount: count() })
    .from(order)
    .where(currentWhere)

  const totalRevenue = Number(cur?.totalRevenue ?? 0)
  const orderCount = Number(cur?.orderCount ?? 0)
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

  let changePercent = 0
  if (period !== 'all') {
    const days = periodDays(period)
    const cut = daysAgo(days)
    const prevCut = daysAgo(days * 2)

    const [prev] = await db
      .select({ totalRevenue: sum(order.total) })
      .from(order)
      .where(
        and(
          inArray(order.status, [...COMPLETED]),
          gte(order.createdAt, prevCut),
          lt(order.createdAt, cut),
        ),
      )

    const prevRevenue = Number(prev?.totalRevenue ?? 0)
    if (prevRevenue > 0) {
      changePercent = ((totalRevenue - prevRevenue) / prevRevenue) * 100
    }
  }

  return {
    totalRevenue,
    orderCount,
    avgOrderValue,
    changePercent: Math.round(changePercent * 10) / 10,
  }
}

// ── getRevenueByDay ───────────────────────────────────────────────────────

export async function getRevenueByDay(days: number) {
  const cutoffDate = daysAgo(days)

  const rows = await db
    .select({
      date: sql<string>`to_char(DATE(${order.createdAt}), 'YYYY-MM-DD')`.as('date'),
      revenue: sql<string>`COALESCE(SUM(${order.total}), '0')`.as('revenue'),
      orders: sql<number>`COUNT(${order.id})`.as('orders'),
    })
    .from(order)
    .where(and(inArray(order.status, [...COMPLETED]), gte(order.createdAt, cutoffDate)))
    .groupBy(sql`DATE(${order.createdAt})`)
    .orderBy(sql`DATE(${order.createdAt}) ASC`)

  return rows.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }))
}

// ── getTopProducts ────────────────────────────────────────────────────────

export async function getTopProducts(limit = 10) {
  const rows = await db
    .select({
      productId: orderLine.productId,
      name: orderLine.productName,
      image: orderLine.productImage,
      totalQty: sql<number>`CAST(SUM(${orderLine.qty}) AS INTEGER)`.as('totalQty'),
      totalRevenue: sql<string>`COALESCE(SUM(${orderLine.subtotal}), '0')`.as('totalRevenue'),
    })
    .from(orderLine)
    .innerJoin(order, eq(orderLine.orderId, order.id))
    .where(inArray(order.status, [...COMPLETED]))
    .groupBy(orderLine.productId, orderLine.productName, orderLine.productImage)
    .orderBy(sql`SUM(${orderLine.qty}) DESC`)
    .limit(limit)

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    image: r.image,
    totalQty: Number(r.totalQty ?? 0),
    totalRevenue: Number(r.totalRevenue),
  }))
}

// ── getTopSuppliers ───────────────────────────────────────────────────────

export async function getTopSuppliers(limit = 10) {
  const rows = await db
    .select({
      supplierId: supplierTable.id,
      supplierName: supplierTable.name,
      totalRevenue: sql<string>`COALESCE(SUM(${order.total}), '0')`.as('totalRevenue'),
      orderCount: sql<number>`COUNT(${order.id})`.as('orderCount'),
    })
    .from(order)
    .innerJoin(supplierTable, eq(order.supplierId, supplierTable.id))
    .where(inArray(order.status, [...COMPLETED]))
    .groupBy(supplierTable.id, supplierTable.name)
    .orderBy(sql`SUM(${order.total}) DESC`)
    .limit(limit)

  return rows.map((r) => ({
    supplierId: r.supplierId,
    name: r.supplierName,
    totalRevenue: Number(r.totalRevenue),
    orderCount: Number(r.orderCount),
  }))
}

// ── getOrderStatusBreakdown ───────────────────────────────────────────────

export async function getOrderStatusBreakdown() {
  const rows = await db
    .select({
      status: order.status,
      orderCount: sql<number>`COUNT(*)`.as('orderCount'),
    })
    .from(order)
    .groupBy(order.status)
    .orderBy(desc(sql`COUNT(*)`))

  return rows.map((r) => ({ status: r.status, count: Number(r.orderCount) }))
}

// ── getNewUsersCount ──────────────────────────────────────────────────────

export async function getNewUsersCount(days: number) {
  const [row] = await db
    .select({ cnt: count() })
    .from(user)
    .where(gte(user.createdAt, daysAgo(days)))

  return Number(row?.cnt ?? 0)
}

// ── getKpiSnapshot ────────────────────────────────────────────────────────

export async function getKpiSnapshot() {
  const [
    revenueRow,
    ordersRow,
    usersRow,
    productsRow,
    suppliersRow,
    activeProductsRow,
    pendingApprovalsRow,
    pendingWithdrawalsRow,
  ] = await Promise.all([
    db
      .select({ v: sql<string>`COALESCE(SUM(${order.total}), '0')` })
      .from(order)
      .where(inArray(order.status, [...COMPLETED])),
    db.select({ v: count() }).from(order),
    db.select({ v: count() }).from(user),
    db.select({ v: count() }).from(productTable),
    db.select({ v: count() }).from(supplierTable),
    db.select({ v: count() }).from(productTable).where(eq(productTable.active, true)),
    db.select({ v: count() }).from(productTable).where(eq(productTable.status, 'pending_approval')),
    db.select({ v: count() }).from(payoutTable).where(eq(payoutTable.status, 'pending')),
  ])

  return {
    totalRevenue:       Number(revenueRow[0]?.v ?? 0),
    totalOrders:        Number(ordersRow[0]?.v ?? 0),
    totalUsers:         Number(usersRow[0]?.v ?? 0),
    totalProducts:      Number(productsRow[0]?.v ?? 0),
    totalSuppliers:     Number(suppliersRow[0]?.v ?? 0),
    activeProducts:     Number(activeProductsRow[0]?.v ?? 0),
    pendingApprovals:   Number(pendingApprovalsRow[0]?.v ?? 0),
    pendingWithdrawals: Number(pendingWithdrawalsRow[0]?.v ?? 0),
  }
}
