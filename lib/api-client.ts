/**
 * lib/api-client.ts
 * Thin fetch wrappers for all /api/v1/ endpoints.
 * Safe to import from client components — no server-only code here.
 */

import type * as AdminSvc from '@/services/admin'

type ApiEnvelope<T> = { data: T }

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const json = (await res.json()) as ApiEnvelope<T> | T
  if (json !== null && typeof json === 'object' && 'data' in json) {
    return (json as ApiEnvelope<T>).data
  }
  return json as T
}

// ── Orders ──────────────────────────────────────────────────────────────────

import type { Order, OrderLine } from '@/lib/order-types'
export type { Order, OrderLine } from '@/lib/order-types'

export function fetchOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('orders')
}

export function fetchOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`orders/${id}`)
}

export async function cancelOrderApi(id: string): Promise<void> {
  await apiFetch<void>(`orders/${id}/cancel`, { method: 'POST' })
}

export function createOrderApi(body: {
  lines: { productId: string; qty: number; variantId?: string }[]
  address: { label: string; line1?: string; city?: string; phone?: string }
  paymentMethod: 'cod' | 'card' | 'bank'
}): Promise<Order> {
  return apiFetch<Order>('orders', { method: 'POST', body: JSON.stringify(body) })
}

// ── Account ─────────────────────────────────────────────────────────────────

import type { Address, Profile } from '@/lib/account-types'
import type { AccountProduct } from '@/services/account'
import type { ReorderTemplate } from '@/lib/account-types'
export type { Address, Profile } from '@/lib/account-types'

export function fetchAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>('account/addresses')
}

export function fetchProfile(): Promise<Profile> {
  return apiFetch<Profile>('account/profile')
}

export function updateProfileApi(data: Partial<Profile>): Promise<Profile> {
  return apiFetch<Profile>('account/profile', { method: 'PATCH', body: JSON.stringify(data) })
}

export function apiFetchBuyerType(data: { role: 'consumer' | 'merchant'; company?: string }): Promise<Profile> {
  return apiFetch<Profile>('account/buyer-type', { method: 'POST', body: JSON.stringify(data) })
}

export function apiPartnerOnboard(data: { company: string; phone?: string; crNumber?: string }): Promise<unknown> {
  return apiFetch('partner/onboard', { method: 'POST', body: JSON.stringify(data) })
}

export function fetchPartnerDashboard(): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerDashboard>>> {
  return apiFetch('partner/dashboard')
}

export function fetchPartnerProducts(): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerProducts>>> {
  return apiFetch('partner/products')
}

export function fetchPartnerOrders(): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerOrders>>> {
  return apiFetch('partner/orders')
}

export function fetchPartnerInvoices(): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerInvoices>>> {
  return apiFetch('partner/invoices')
}

export function createPartnerProductApi(data: Record<string, unknown>): Promise<unknown> {
  return apiFetch('partner/products', { method: 'POST', body: JSON.stringify(data) })
}

export function savePartnerProductApi(id: string | null, data: Record<string, unknown>): Promise<unknown> {
  if (id) {
    return apiFetch(`partner/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })
  }
  return createPartnerProductApi(data)
}

export function deletePartnerProductApi(id: string): Promise<void> {
  return apiFetch(`partner/products/${encodeURIComponent(id)}`, { method: 'DELETE' }) as Promise<void>
}

export function updatePartnerProductApi(productId: string, active: boolean): Promise<unknown> {
  return apiFetch(`partner/products/${encodeURIComponent(productId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function fetchPartnerCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  return apiFetch('partner/categories')
}

export function updatePartnerStoreApi(data: Record<string, unknown>): Promise<unknown> {
  return apiFetch('partner/store', { method: 'PATCH', body: JSON.stringify(data) })
}

export function fetchPartnerOrder(id: string): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerOrderDetail>>> {
  return apiFetch(`partner/orders/${encodeURIComponent(id)}`)
}

export function fetchPartnerInvoice(id: string): Promise<Awaited<ReturnType<typeof import('@/services/partner').getPartnerInvoiceDetail>>> {
  return apiFetch(`partner/invoices/${encodeURIComponent(id)}`)
}

export function submitMerchantKycApi(data: { company: string; crNumber?: string; vatNumber?: string }): Promise<unknown> {
  return apiFetch('account/kyc', { method: 'POST', body: JSON.stringify(data) })
}

export function fetchMerchantKycStatus(): Promise<{ status: string; crNumber?: string }> {
  return apiFetch('account/kyc')
}

export function addAddressApi(addr: Omit<Address, 'id'>): Promise<Address> {
  return apiFetch<Address>('account/addresses', { method: 'POST', body: JSON.stringify(addr) })
}

export async function removeAddressApi(id: string): Promise<void> {
  await apiFetch<void>(`account/addresses/${id}`, { method: 'DELETE' })
}

export function updateAddressApi(id: string, data: Partial<Omit<Address, 'id'>>): Promise<Address> {
  return apiFetch<Address>(`account/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function fetchFavorites(): Promise<AccountProduct[]> {
  return apiFetch<AccountProduct[]>('account/favorites')
}

export async function toggleFavoriteApi(productId: string): Promise<boolean> {
  const res = await apiFetch<{ favorited: boolean }>(`account/favorites/${productId}`, { method: 'POST' })
  return res.favorited
}

export function fetchTemplates(): Promise<ReorderTemplate[]> {
  return apiFetch<ReorderTemplate[]>('account/templates')
}

// ── Admin ───────────────────────────────────────────────────────────────────

export type ApprovalType = { id: string; userId: string; type: string; status: string; crNumber?: string; vatNumber?: string; documents: unknown[]; submittedAt: string }
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export function fetchAdminKpi(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminKpi>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminKpi>>>('admin/kpi')
}

export function getAdminKpi(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminKpi>>> {
  return fetchAdminKpi()
}

export function getAdminOrders(params?: Record<string, string>): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminOrders>>> {
  const q = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminOrders>>>(`admin/orders${q}`)
}

export function getAdminSuppliers(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminSuppliers>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminSuppliers>>>('admin/suppliers')
}

export function getAdminBuyers(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminBuyers>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminBuyers>>>('admin/buyers')
}

export function getApprovals(): Promise<Awaited<ReturnType<typeof AdminSvc.getApprovals>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getApprovals>>>('admin/approvals')
}

export function getSupportTickets(): Promise<Awaited<ReturnType<typeof AdminSvc.getSupportTickets>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getSupportTickets>>>('admin/tickets')
}

export function getAuditLogs(): Promise<Awaited<ReturnType<typeof AdminSvc.getAuditLogs>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAuditLogs>>>('admin/audit')
}

export function getPayouts(): Promise<Awaited<ReturnType<typeof AdminSvc.getPayouts>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getPayouts>>>('admin/finance?type=payouts')
}

export function getTransactions(): Promise<Awaited<ReturnType<typeof AdminSvc.getTransactions>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getTransactions>>>('admin/finance?type=transactions')
}

export function getDeliveryZones(): Promise<Awaited<ReturnType<typeof AdminSvc.getDeliveryZones>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getDeliveryZones>>>('admin/zones')
}

export function getAdminCountries(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminCountries>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminCountries>>>('admin/countries')
}

export function createCountryApi(data: {
  code: string
  name: string
  nameEn: string
  currency: string
  active?: boolean
}): Promise<Awaited<ReturnType<typeof AdminSvc.createCountry>>> {
  return apiFetch('admin/countries', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCountryApi(
  code: string,
  data: Partial<{ name: string; nameEn: string; currency: string; active: boolean; enabled: boolean }>,
): Promise<Awaited<ReturnType<typeof AdminSvc.updateCountry>>> {
  return apiFetch(`admin/countries/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function createZoneApi(data: {
  name: string
  nameEn?: string
  city?: string
  country?: string
  fee: number
  minOrder: number
  active?: boolean
  status?: string
}): Promise<Awaited<ReturnType<typeof AdminSvc.upsertDeliveryZone>>> {
  return apiFetch('admin/zones', { method: 'POST', body: JSON.stringify(data) })
}

export function updateZoneApi(
  id: string,
  data: {
    name: string
    nameEn?: string
    city?: string
    country?: string
    fee: number
    minOrder: number
    active?: boolean
    status?: string
  },
): Promise<Awaited<ReturnType<typeof AdminSvc.upsertDeliveryZone>>> {
  return apiFetch(`admin/zones/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function updateApprovalApi(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<unknown> {
  return apiFetch(`admin/approvals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function getAdminRoles(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminRoles>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminRoles>>>('admin/roles')
}

export function getPermissionMatrix(): Promise<Awaited<ReturnType<typeof AdminSvc.getPermissionMatrix>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getPermissionMatrix>>>('admin/roles?matrix=1')
}

export function fetchAdminDrivers(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminDrivers>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminDrivers>>>('admin/drivers')
}

export function fetchAdminCollection<T extends { id: number }>(key: string): Promise<T[]> {
  return apiFetch<T[]>(`admin/collections/${encodeURIComponent(key)}`)
}

export function saveAdminCollection<T extends { id: number }>(key: string, items: T[]): Promise<T[]> {
  return apiFetch<T[]>(`admin/collections/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export function getAdminSessions(): Promise<Awaited<ReturnType<typeof AdminSvc.getAdminSessions>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvc.getAdminSessions>>>('admin/sessions')
}

export function revokeAdminSessionApi(sessionId: string): Promise<{ ok: boolean }> {
  return apiFetch(`admin/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
}

// ── Admin Products ─────────────────────────────────────────────────────────
import type * as AdminSvcNs from '@/services/admin'

export function getAdminProducts(): Promise<Awaited<ReturnType<typeof AdminSvcNs.getAdminProducts>>> {
  return apiFetch<Awaited<ReturnType<typeof AdminSvcNs.getAdminProducts>>>('admin/products')
}

export function toggleAdminProduct(id: string, active: boolean): Promise<{ id: string; active: boolean }> {
  return apiFetch<{ id: string; active: boolean }>(`admin/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

// ── Admin Withdrawals ──────────────────────────────────────────────────────
type WithdrawalRow = {
  id: string; supplier: string; supplierId: string; amount: number; currency: string
  status: string; reference: string; bankAccount: Record<string, string> | null
  processedAt: string | null; createdAt: string
}

export function getAdminWithdrawals(): Promise<WithdrawalRow[]> {
  return apiFetch<WithdrawalRow[]>('admin/finance/withdrawals')
}

export function updateAdminWithdrawal(id: string, data: { status: string; reference?: string }): Promise<WithdrawalRow> {
  return apiFetch<WithdrawalRow>(`admin/finance/withdrawals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── System Settings ────────────────────────────────────────────────────────
import type { SystemSettings } from '@/lib/settings'
export type { SystemSettings } from '@/lib/settings'

export function getAdminSettings(): Promise<SystemSettings> {
  return apiFetch<SystemSettings>('admin/settings')
}

export function updateAdminSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
  return apiFetch<SystemSettings>('admin/settings', { method: 'PATCH', body: JSON.stringify(patch) })
}

// ── Refunds ────────────────────────────────────────────────────────────────

import type { getRefundRequests, getAdminRefundRequests } from '@/services/refunds'

export type RefundRow = Awaited<ReturnType<typeof getRefundRequests>>[number]
export type AdminRefundRow = Awaited<ReturnType<typeof getAdminRefundRequests>>[number]

export function getRefundsApi(): Promise<RefundRow[]> {
  return apiFetch<RefundRow[]>('account/refunds')
}

export function submitRefundApi(data: {
  orderId: string
  reason: string
  description: string
  orderLineId?: string
  images?: string[]
}): Promise<unknown> {
  return apiFetch('account/refunds', { method: 'POST', body: JSON.stringify(data) })
}

export function getAdminRefundsApi(status?: string): Promise<AdminRefundRow[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiFetch<AdminRefundRow[]>(`admin/refunds${q}`)
}

export function approveRefundApi(id: string, adminNote?: string): Promise<unknown> {
  return apiFetch(`admin/refunds/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNote }),
  })
}

export function rejectRefundApi(id: string, reason: string): Promise<unknown> {
  return apiFetch(`admin/refunds/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function processRefundApi(id: string): Promise<unknown> {
  return apiFetch(`admin/refunds/${encodeURIComponent(id)}/process`, { method: 'POST' })
}

// ── Reviews ────────────────────────────────────────────────────────────────

import type { getProductReviews } from '@/services/reviews'
export type ProductReviewSummary = Awaited<ReturnType<typeof getProductReviews>>

export function fetchProductReviews(productId: string): Promise<ProductReviewSummary> {
  return apiFetch<ProductReviewSummary>(`products/${encodeURIComponent(productId)}/reviews`)
}

export function submitReviewApi(
  productId: string,
  data: { rating: number; title?: string; body: string },
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `products/${encodeURIComponent(productId)}/reviews`,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export function toggleReviewHelpfulApi(
  productId: string,
  reviewId: string,
): Promise<{ helpful: boolean; count: number }> {
  return apiFetch<{ helpful: boolean; count: number }>(
    `products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
    { method: 'POST' },
  )
}

export function submitReviewReplyApi(
  productId: string,
  reviewId: string,
  body: string,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}/reply`,
    { method: 'POST', body: JSON.stringify({ body }) },
  )
}

// ── Admin Product Approvals ────────────────────────────────────────────────

export function getPendingProductsApi(): Promise<Awaited<ReturnType<typeof import('@/services/approvals').getPendingProducts>>> {
  return apiFetch('admin/products/pending')
}

export function approveProductApi(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`admin/products/${encodeURIComponent(id)}/approve`, { method: 'POST' })
}

export function rejectProductApi(id: string, reason: string): Promise<{ ok: boolean }> {
  return apiFetch(`admin/products/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Admin Supplier Commission ──────────────────────────────────────────────

export function setSupplierCommissionApi(supplierId: string, rate: number): Promise<unknown> {
  return apiFetch(`admin/suppliers/${encodeURIComponent(supplierId)}/commission`, {
    method: 'PATCH',
    body: JSON.stringify({ rate }),
  })
}

export function getCommissionReportApi(): Promise<Awaited<ReturnType<typeof import('@/services/admin').getCommissionReport>>> {
  return apiFetch('admin/commissions')
}

// ── Admin Withdrawal Actions ───────────────────────────────────────────────

export function approveWithdrawalApi(id: string): Promise<unknown> {
  return apiFetch(`admin/finance/withdrawals/${encodeURIComponent(id)}/approve`, { method: 'POST' })
}

export function rejectWithdrawalApi(id: string, reason: string): Promise<unknown> {
  return apiFetch(`admin/finance/withdrawals/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export function markWithdrawalPaidApi(id: string, reference: string): Promise<unknown> {
  return apiFetch(`admin/finance/withdrawals/${encodeURIComponent(id)}/paid`, { method: 'POST', body: JSON.stringify({ reference }) })
}

// ── Partner Variants ───────────────────────────────────────────────────────

export type PartnerVariant = {
  id: string; productId: string; sku: string; barcode: string | null
  price: string; compareAtPrice: string | null; stock: number
  lowStockThreshold: number; weight: string | null
  images: string[]; options: Record<string, string>
  isDefault: boolean; active: boolean
  createdAt: string; updatedAt: string
}

export function fetchPartnerVariants(productId: string): Promise<PartnerVariant[]> {
  return apiFetch<PartnerVariant[]>(`partner/products/${encodeURIComponent(productId)}/variants`)
}

export function createPartnerVariantApi(productId: string, data: Record<string, unknown>): Promise<PartnerVariant> {
  return apiFetch<PartnerVariant>(`partner/products/${encodeURIComponent(productId)}/variants`, { method: 'POST', body: JSON.stringify(data) })
}

export function updatePartnerVariantApi(productId: string, variantId: string, data: Record<string, unknown>): Promise<PartnerVariant> {
  return apiFetch<PartnerVariant>(`partner/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deletePartnerVariantApi(productId: string, variantId: string): Promise<void> {
  return apiFetch(`partner/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, { method: 'DELETE' }) as Promise<void>
}

// ── Public Variants ────────────────────────────────────────────────────────

export function fetchProductVariants(productId: string): Promise<unknown[]> {
  return apiFetch(`products/${encodeURIComponent(productId)}/variants`)
}

// ── Catalog (client-safe wrappers) ─────────────────────────────────────────
import type { CategoryResult, SupplierResult, Product } from '@/services/catalog'
export type { CategoryResult, SupplierResult, Product } from '@/services/catalog'

export function getCategoryWithProducts(slug: string): Promise<CategoryResult> {
  return apiFetch<CategoryResult>(`categories?slug=${encodeURIComponent(slug)}`)
}

export function getSupplierWithProducts(slug: string): Promise<SupplierResult> {
  return apiFetch<SupplierResult>(`suppliers?slug=${encodeURIComponent(slug)}`)
}

export function searchProducts(q: string): Promise<Product[]> {
  return apiFetch<Product[]>(`products?q=${encodeURIComponent(q)}`)
}

export function searchProductsApi(filters: {
  q?: string
  category?: string
  supplier?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sortBy?: string
  page?: number
  limit?: number
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.supplier) params.set('supplier', filters.supplier)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating))
  if (filters.inStock) params.set('inStock', 'true')
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  const qs = params.toString()
  return apiFetch<{ products: Product[]; total: number; page: number; totalPages: number }>(
    `products/search${qs ? `?${qs}` : ''}`,
  )
}

export function fetchProductById(id: string): Promise<Product | undefined> {
  return apiFetch<Product[]>(`products?q=${encodeURIComponent(id)}`).then((list) =>
    list.find((p) => p.id === id),
  )
}

// ── Flash Sales ────────────────────────────────────────────────────────────

export function getAdminFlashSales(): Promise<any> {
  return apiFetch<any>('admin/flash-sales')
}

export function createFlashSaleApi(data: any): Promise<any> {
  return apiFetch<any>('admin/flash-sales', { method: 'POST', body: JSON.stringify(data) })
}

export function updateFlashSaleApi(id: string, data: any): Promise<any> {
  return apiFetch<any>(`admin/flash-sales/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteFlashSaleApi(id: string): Promise<void> {
  await apiFetch<void>(`admin/flash-sales/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getFlashSaleApi(id: string): Promise<any> {
  return apiFetch<any>(`admin/flash-sales/${encodeURIComponent(id)}`)
}

export function addProductToFlashSaleApi(saleId: string, productId: string, overridePrice?: string, stockLimit?: number): Promise<any> {
  return apiFetch<any>(`admin/flash-sales/${encodeURIComponent(saleId)}/products`, {
    method: 'POST',
    body: JSON.stringify({ productId, overridePrice, stockLimit }),
  })
}

export async function removeProductFromFlashSaleApi(saleId: string, productId: string): Promise<void> {
  await apiFetch<void>(`admin/flash-sales/${encodeURIComponent(saleId)}/products/${encodeURIComponent(productId)}`, { method: 'DELETE' })
}

export function getActiveFlashSalesApi(): Promise<any> {
  return apiFetch<any>('flash-sales/active')
}

// ── Loyalty ────────────────────────────────────────────────────────────────

import type { AdminLoyaltySummary, AdminLoyaltyAccount } from '@/services/loyalty'
import type { LoyaltyAccount, LoyaltyTransaction } from '@/lib/db/schema'

export type AdminLoyaltyData = { summary: AdminLoyaltySummary; accounts: AdminLoyaltyAccount[] }
export type AccountLoyaltyData = { account: LoyaltyAccount; transactions: LoyaltyTransaction[] }

export function getLoyaltyApi(): Promise<AccountLoyaltyData> {
  return apiFetch<AccountLoyaltyData>('account/loyalty')
}

export function redeemLoyaltyApi(points: number, orderId?: string): Promise<{ balance: number; transactionId: string }> {
  return apiFetch<{ balance: number; transactionId: string }>('account/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify({ points, orderId }),
  })
}

export function getAdminLoyaltyApi(): Promise<AdminLoyaltyData> {
  return apiFetch<AdminLoyaltyData>('admin/loyalty')
}

// ── Referrals ──────────────────────────────────────────────────────────────

import type { getAdminReferrals, getAdminReferralStats, getReferralsByUser } from '@/services/referrals'

export type ReferralStats = Awaited<ReturnType<typeof getAdminReferralStats>>
export type AdminReferralRow = Awaited<ReturnType<typeof getAdminReferrals>>[number]
export type UserReferral = Awaited<ReturnType<typeof getReferralsByUser>>[number]

export type ReferralApiData = {
  code: string
  usageCount: number
  referrals: UserReferral[]
}

export type AdminReferralApiData = {
  stats: ReferralStats
  referrals: AdminReferralRow[]
}

export function getReferralApi(): Promise<ReferralApiData> {
  return apiFetch<ReferralApiData>('account/referral')
}

export function getAdminReferralsApi(): Promise<AdminReferralApiData> {
  return apiFetch<AdminReferralApiData>('admin/referrals')
}

export function rewardReferralApi(id: string): Promise<unknown> {
  return apiFetch(`admin/referrals/${encodeURIComponent(id)}/reward`, { method: 'POST' })
}

export function adjustLoyaltyApi(
  userId: string,
  delta: number,
  note: string,
): Promise<{ balance: number; transactionId: string }> {
  return apiFetch<{ balance: number; transactionId: string }>(
    `admin/loyalty/${encodeURIComponent(userId)}/adjust`,
    { method: 'POST', body: JSON.stringify({ delta, note }) },
  )
}

// ── Notifications ──────────────────────────────────────────────────────────

export type SerializedNotification = {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export function getNotificationsApi(): Promise<{ notifications: SerializedNotification[]; unreadCount: number }> {
  return apiFetch<{ notifications: SerializedNotification[]; unreadCount: number }>('account/notifications')
}

export function markNotificationReadApi(id: string): Promise<unknown> {
  return apiFetch(`account/notifications/${encodeURIComponent(id)}`, { method: 'PATCH' })
}

export function markAllNotificationsReadApi(): Promise<unknown> {
  return apiFetch('account/notifications/read-all', { method: 'POST' })
}

export function deleteNotificationApi(id: string): Promise<void> {
  return apiFetch(`account/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }) as Promise<void>
}

export function broadcastNotificationApi(data: {
  type: string
  title: string
  body: string
  link?: string
  userIds?: string[]
}): Promise<unknown> {
  return apiFetch('admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) })
}

// ── Shipping Rules ───────────────────────────────────────────────────────────

import type * as ShippingSvc from '@/services/shipping'

export type ZoneWithRules = Awaited<ReturnType<typeof ShippingSvc.getZones>>[number]
export type ShippingRuleRow = Awaited<ReturnType<typeof ShippingSvc.getShippingRules>>[number]

export function getZonesWithRules(): Promise<ZoneWithRules[]> {
  return apiFetch<ZoneWithRules[]>('admin/zones')
}

export function getZoneWithRules(id: string): Promise<ZoneWithRules> {
  return apiFetch<ZoneWithRules>(`admin/zones/${encodeURIComponent(id)}`)
}

export function getZoneRulesApi(zoneId: string): Promise<ShippingRuleRow[]> {
  return apiFetch<ShippingRuleRow[]>(`admin/zones/${encodeURIComponent(zoneId)}/rules`)
}

export function createZoneRuleApi(
  zoneId: string,
  data: {
    name: string
    minOrderAmount?: number
    maxOrderAmount?: number | null
    freeAbove?: number | null
    baseFee?: number
    perKgFee?: number
    estimatedDays?: number
    active?: boolean
  },
): Promise<ShippingRuleRow> {
  return apiFetch<ShippingRuleRow>(`admin/zones/${encodeURIComponent(zoneId)}/rules`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateZoneRuleApi(
  zoneId: string,
  ruleId: string,
  data: Partial<{
    name: string
    minOrderAmount: number
    maxOrderAmount: number | null
    freeAbove: number | null
    baseFee: number
    perKgFee: number
    estimatedDays: number
    active: boolean
  }>,
): Promise<ShippingRuleRow> {
  return apiFetch<ShippingRuleRow>(`admin/zones/${encodeURIComponent(zoneId)}/rules/${encodeURIComponent(ruleId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteZoneRuleApi(zoneId: string, ruleId: string): Promise<void> {
  return apiFetch<void>(`admin/zones/${encodeURIComponent(zoneId)}/rules/${encodeURIComponent(ruleId)}`, {
    method: 'DELETE',
  })
}

export function deleteZoneApi(id: string): Promise<void> {
  return apiFetch<void>(`admin/zones/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Analytics ──────────────────────────────────────────────────────────────

import type {
  getRevenueSummary,
  getRevenueByDay,
  getTopProducts,
  getTopSuppliers,
  getOrderStatusBreakdown,
  getKpiSnapshot,
} from '@/services/analytics'

export type RevenueSummary    = Awaited<ReturnType<typeof getRevenueSummary>>
export type RevenueByDay      = Awaited<ReturnType<typeof getRevenueByDay>>
export type TopProducts       = Awaited<ReturnType<typeof getTopProducts>>
export type TopSuppliers      = Awaited<ReturnType<typeof getTopSuppliers>>
export type OrderStatusItems  = Awaited<ReturnType<typeof getOrderStatusBreakdown>>
export type KpiSnapshot       = Awaited<ReturnType<typeof getKpiSnapshot>>

export function getAnalyticsSummaryApi(period = '30d'): Promise<RevenueSummary> {
  return apiFetch<RevenueSummary>(`admin/analytics/summary?period=${encodeURIComponent(period)}`)
}

export function getRevenueByDayApi(days = 30): Promise<RevenueByDay> {
  return apiFetch<RevenueByDay>(`admin/analytics/revenue-by-day?days=${days}`)
}

export function getTopProductsApi(limit?: number): Promise<TopProducts> {
  const qs = limit !== undefined ? `?limit=${limit}` : ''
  return apiFetch<TopProducts>(`admin/analytics/top-products${qs}`)
}

export function getTopSuppliersApi(limit?: number): Promise<TopSuppliers> {
  const qs = limit !== undefined ? `?limit=${limit}` : ''
  return apiFetch<TopSuppliers>(`admin/analytics/top-suppliers${qs}`)
}

export function getAnalyticsKpiApi(): Promise<KpiSnapshot> {
  return apiFetch<KpiSnapshot>('admin/analytics/kpi')
}

export function calculateShippingApi(params: {
  zoneId: string
  amount: number
  weight?: number
}): Promise<{ fee: number; estimatedDays: number; isFree: boolean }> {
  const qs = new URLSearchParams({
    zoneId: params.zoneId,
    amount: String(params.amount),
    ...(params.weight !== undefined ? { weight: String(params.weight) } : {}),
  })
  return apiFetch<{ fee: number; estimatedDays: number; isFree: boolean }>(`shipping/calculate?${qs}`)
}

