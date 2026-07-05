/**
 * lib/order-types.ts
 * Shared order types and constants that can be safely imported by both
 * server components and client components (no server-only code here).
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type OrderEvent = {
  status: OrderStatus
  at: string
}

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
  productName: string
  productImage: string | null
  qty: number
  unitPrice: number
}

export type OrderAddress = {
  label: string
  line1: string
  city: string
  phone: string
}

export type Order = {
  id: string
  ref: string
  createdAt: string
  status: OrderStatus
  timeline: OrderEvent[]
  lines: (OrderLine & { product?: { image?: string; nameAr?: string; nameEn?: string } })[]
  subtotalUsd: number
  shippingUsd: number
  savingsUsd: number
  totalUsd: number
  totalCents: number
  address: OrderAddress
  addressLabel: string
  deliverySlotAr: string
  deliverySlotEn: string
  paymentMethod: 'cod' | 'card' | 'bank'
}
