import axios from 'axios'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// On web the app is served behind a same-origin proxy that forwards /api/* to the
// backend, so we use a relative base (avoids CORS + mixed-content and lets the
// better-auth session cookie flow). Native builds talk to the backend directly.
export const BASE_URL = Platform.OS === 'web' ? '' : 'http://213.136.68.39:3600'
const API_URL = `${BASE_URL}/api/v1`

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response normalization ────────────────────────────────────────────────────
// Backend wraps list/detail payloads in { data: ... }. Unwrap to the inner value.
function unwrap(res: any) {
  const d = res?.data
  if (d && typeof d === 'object' && !Array.isArray(d) && 'data' in d) return d.data
  return d
}

// Map a backend product to the shape the UI expects (name/price/imageUrl/...).
function mapProduct(p: any) {
  if (!p || typeof p !== 'object') return p
  const tierPrice = Array.isArray(p.tiers) && p.tiers.length
    ? (p.tiers[0]?.price ?? p.tiers[0]?.unitPrice)
    : undefined
  return {
    ...p,
    id: p.id,
    name: p.name ?? p.nameEn ?? p.nameAr,
    nameAr: p.nameAr ?? p.name ?? p.nameEn,
    price: p.price ?? p.basePrice ?? tierPrice ?? 0,
    imageUrl: p.imageUrl ?? p.image ?? null,
    stock: p.stock, // undefined => treated as in-stock by the detail screen
    minOrderQty: p.minOrderQty ?? p.moq,
    description: p.description ?? p.descriptionEn,
    descriptionAr: p.descriptionAr ?? p.description,
    categoryId: p.categoryId ?? p.categorySlug,
  }
}

// Map a backend category (slug/nameEn) to the shape the UI expects (id/name).
function mapCategory(c: any) {
  if (!c || typeof c !== 'object') return c
  return {
    ...c,
    id: c.id ?? c.slug,
    name: c.name ?? c.nameEn ?? c.nameAr,
    nameAr: c.nameAr ?? c.name ?? c.nameEn,
    slug: c.slug ?? c.id,
  }
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : []
}

// Auth
export async function loginApi(email: string, password: string) {
  const res = await axios.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    { email, password, returnSessionToken: true },
    { withCredentials: true }
  )
  return res.data
}

export async function registerApi(data: { email: string; password: string; name: string; phone?: string }) {
  const res = await axios.post(
    `${BASE_URL}/api/auth/sign-up/email`,
    { email: data.email, password: data.password, name: data.name, phone: data.phone, returnSessionToken: true },
    { withCredentials: true }
  )
  return res.data
}

// Products
export async function getProducts(params?: { q?: string; category?: string; page?: number }) {
  const res = await api.get('/products', { params })
  return asArray(unwrap(res)).map(mapProduct)
}

export async function getProduct(id: string) {
  try {
    const res = await api.get(`/products/${id}`)
    const d = unwrap(res)
    if (d && typeof d === 'object' && (d.id || d.nameAr || d.nameEn || d.name)) return mapProduct(d)
  } catch {
    // detail route may be unavailable — fall back to the list below
  }
  const all = await getProducts()
  return all.find((p: any) => p.id === id) ?? null
}

// Categories
export async function getCategories() {
  const res = await api.get('/categories')
  return asArray(unwrap(res)).map(mapCategory)
}

// Flash Sales
export async function getFlashSales() {
  const res = await api.get('/flash-sales')
  return asArray(unwrap(res)).map(mapProduct)
}

// Orders
export async function getOrders() {
  const res = await api.get('/orders')
  return asArray(unwrap(res))
}

export async function getOrder(id: string) {
  const res = await api.get(`/orders/${id}`)
  return unwrap(res)
}

export async function createOrder(data: {
  lines: Array<{ productId: string; qty: number; unitPrice: number }>
  address: { label: string; street?: string; city?: string }
  paymentMethod: string
}) {
  const res = await api.post('/orders', data)
  return unwrap(res)
}

export async function cancelOrder(id: string) {
  const res = await api.post(`/orders/${id}/cancel`)
  return unwrap(res)
}

// Profile
export async function getProfile() {
  const res = await api.get('/account/profile')
  return unwrap(res)
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  const res = await api.patch('/account/profile', data)
  return unwrap(res)
}

// Addresses
export async function getAddresses() {
  const res = await api.get('/account/addresses')
  return asArray(unwrap(res))
}

// Search
export async function searchProducts(q: string) {
  const res = await api.get('/products', { params: { q } })
  return asArray(unwrap(res)).map(mapProduct)
}
