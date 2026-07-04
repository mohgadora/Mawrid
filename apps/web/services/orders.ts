import type { Role } from '@/lib/config'
import { getProduct, marketSavingsUsd, priceForRole } from '@/lib/data'
import { lineTotalCents, sumCents, toCents, fromCents } from '@/lib/money'
import { clone, delay, makeId, readStore, writeStore } from './core'

/** The eight lifecycle states an order can be in. `cancelled` is terminal. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** The happy-path progression (cancelled is excluded — it can happen anytime). */
export const ORDER_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]

export type OrderLine = {
  productId: string
  nameAr: string
  nameEn: string
  image: string
  qty: number
  unitPriceUsd: number
}

export type OrderEvent = {
  status: OrderStatus
  at: string // ISO
}

export type OrderAddress = {
  labelAr: string
  labelEn: string
  line: string
  cityAr: string
  cityEn: string
  phone: string
}

export type Order = {
  id: string
  ref: string
  createdAt: string
  status: OrderStatus
  role: Role
  lines: OrderLine[]
  subtotalUsd: number
  shippingUsd: number
  totalUsd: number
  savingsUsd: number
  discountUsd: number
  couponCode?: string
  address: OrderAddress
  deliverySlotAr: string
  deliverySlotEn: string
  paymentMethod: 'cod' | 'card' | 'bank'
  timeline: OrderEvent[]
}

const STORE_KEY = 'mawrid_orders'

function daysAgo(days: number, hours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hours)
  return d.toISOString()
}

/** Two seeded demo orders so the list/detail views are never empty on first run. */
function seedOrders(): Order[] {
  const rice = getProduct('rice-basmati')
  const oil = getProduct('sunflower-oil')
  const drinks = getProduct('soft-drinks')

  const seedAddress: OrderAddress = {
    labelAr: 'الفرع الرئيسي',
    labelEn: 'Main Branch',
    line: 'شارع الملك فهد، حي العليا',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    phone: '+966 55 123 4567',
  }

  const orders: Order[] = []

  if (rice && oil) {
    const lines: OrderLine[] = [
      {
        productId: rice.id,
        nameAr: rice.nameAr,
        nameEn: rice.nameEn,
        image: rice.image,
        qty: 20,
        unitPriceUsd: priceForRole(rice, 20, 'merchant'),
      },
      {
        productId: oil.id,
        nameAr: oil.nameAr,
        nameEn: oil.nameEn,
        image: oil.image,
        qty: 30,
        unitPriceUsd: priceForRole(oil, 30, 'merchant'),
      },
    ]
    orders.push(
      finalizeSeed({
        ref: 'MW-240118',
        createdAt: daysAgo(1, 4),
        status: 'out_for_delivery',
        role: 'merchant',
        lines,
        address: seedAddress,
        deliverySlotAr: 'غداً، 9 ص - 12 م',
        deliverySlotEn: 'Tomorrow, 9 AM - 12 PM',
        paymentMethod: 'cod',
        flowUntil: 'out_for_delivery',
      }),
    )
  }

  if (drinks) {
    const lines: OrderLine[] = [
      {
        productId: drinks.id,
        nameAr: drinks.nameAr,
        nameEn: drinks.nameEn,
        image: drinks.image,
        qty: 25,
        unitPriceUsd: priceForRole(drinks, 25, 'merchant'),
      },
    ]
    orders.push(
      finalizeSeed({
        ref: 'MW-240094',
        createdAt: daysAgo(6),
        status: 'delivered',
        role: 'merchant',
        lines,
        address: seedAddress,
        deliverySlotAr: 'تم التسليم',
        deliverySlotEn: 'Delivered',
        paymentMethod: 'card',
        flowUntil: 'delivered',
      }),
    )
  }

  return orders
}

type TotalsOptions = {
  /** Coupon discount off the subtotal, in USD. */
  discountUsd?: number
  /** When true, shipping is waived (free-shipping coupon). */
  freeShipping?: boolean
}

function computeTotals(lines: OrderLine[], role: Role, opts: TotalsOptions = {}) {
  const subtotalCents = sumCents(lines.map((l) => lineTotalCents(l.unitPriceUsd, l.qty)))
  let savingsCents = 0
  for (const l of lines) {
    const product = getProduct(l.productId)
    if (!product) continue
    savingsCents += toCents(marketSavingsUsd(product.marketPrice, l.unitPriceUsd, l.qty))
  }
  const discountCents = Math.min(toCents(opts.discountUsd ?? 0), subtotalCents)
  const freeOver = 500
  const shippingCents =
    opts.freeShipping || subtotalCents === 0 || fromCents(subtotalCents) >= freeOver
      ? 0
      : toCents(15)
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents
  return {
    subtotalUsd: fromCents(subtotalCents),
    shippingUsd: fromCents(shippingCents),
    totalUsd: fromCents(totalCents),
    savingsUsd: fromCents(savingsCents),
    discountUsd: fromCents(discountCents),
  }
}

function buildTimeline(status: OrderStatus, createdAt: string): OrderEvent[] {
  if (status === 'cancelled') {
    return [
      { status: 'pending', at: createdAt },
      { status: 'cancelled', at: createdAt },
    ]
  }
  const idx = ORDER_FLOW.indexOf(status)
  const start = new Date(createdAt).getTime()
  return ORDER_FLOW.slice(0, idx + 1).map((s, i) => ({
    status: s,
    at: new Date(start + i * 6 * 3600 * 1000).toISOString(),
  }))
}

function finalizeSeed(
  input: Omit<Order, 'id' | 'subtotalUsd' | 'shippingUsd' | 'totalUsd' | 'savingsUsd' | 'discountUsd' | 'timeline'> & {
    flowUntil: OrderStatus
  },
): Order {
  const { flowUntil, ...rest } = input
  const totals = computeTotals(rest.lines, rest.role)
  return {
    id: makeId('ord'),
    ...rest,
    ...totals,
    timeline: buildTimeline(flowUntil, rest.createdAt),
  }
}

function load(): Order[] {
  const existing = readStore<Order[] | null>(STORE_KEY, null)
  if (existing && existing.length) return existing
  const seeded = seedOrders()
  writeStore(STORE_KEY, seeded)
  return seeded
}

/** All orders, newest first. */
export async function getOrders(): Promise<Order[]> {
  const orders = load().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return delay(clone(orders))
}

/** A single order by id, or null. */
export async function getOrderById(id: string): Promise<Order | null> {
  const order = load().find((o) => o.id === id) ?? null
  return delay(order ? clone(order) : null)
}

export type NewOrderInput = {
  role: Role
  lines: OrderLine[]
  address: OrderAddress
  deliverySlotAr: string
  deliverySlotEn: string
  paymentMethod: Order['paymentMethod']
}

/** Place a new order (persisted to the mock store). */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const createdAt = new Date().toISOString()
  const totals = computeTotals(input.lines, input.role)
  const order: Order = {
    id: makeId('ord'),
    ref: `MW-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt,
    status: 'pending',
    ...input,
    ...totals,
    timeline: buildTimeline('pending', createdAt),
  }
  const orders = load()
  orders.unshift(order)
  writeStore(STORE_KEY, orders)
  return delay(clone(order), 500)
}

/** Cancel an order (no-op if already delivered/cancelled). */
export async function cancelOrder(id: string): Promise<Order | null> {
  const orders = load()
  const order = orders.find((o) => o.id === id)
  if (!order) return delay(null)
  if (order.status !== 'delivered' && order.status !== 'cancelled') {
    order.status = 'cancelled'
    order.timeline = buildTimeline('cancelled', order.createdAt)
    writeStore(STORE_KEY, orders)
  }
  return delay(clone(order))
}
