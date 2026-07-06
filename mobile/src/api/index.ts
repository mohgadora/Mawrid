import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Change this to your server IP/domain
export const BASE_URL = 'http://213.136.68.39:3600'
const API_URL = `${BASE_URL}/api/v1`

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export async function loginApi(email: string, password: string) {
  const res = await axios.post(`${BASE_URL}/api/auth/sign-in/email`, {
    email,
    password,
    returnSessionToken: true,
  })
  return res.data
}

export async function registerApi(data: { email: string; password: string; name: string; phone?: string }) {
  const res = await axios.post(`${BASE_URL}/api/auth/sign-up/email`, {
    email: data.email,
    password: data.password,
    name: data.name,
    returnSessionToken: true,
  })
  return res.data
}

// Products
export async function getProducts(params?: { q?: string; category?: string; page?: number }) {
  const res = await api.get('/products', { params })
  return res.data
}

export async function getProduct(id: string) {
  const res = await api.get(`/products/${id}`)
  return res.data
}

// Categories
export async function getCategories() {
  const res = await api.get('/categories')
  return res.data
}

// Flash Sales
export async function getFlashSales() {
  const res = await api.get('/flash-sales')
  return res.data
}

// Orders
export async function getOrders() {
  const res = await api.get('/orders')
  return res.data
}

export async function getOrder(id: string) {
  const res = await api.get(`/orders/${id}`)
  return res.data
}

export async function createOrder(data: {
  lines: Array<{ productId: string; qty: number; unitPrice: number }>
  address: { label: string; street?: string; city?: string }
  paymentMethod: string
}) {
  const res = await api.post('/orders', data)
  return res.data
}

export async function cancelOrder(id: string) {
  const res = await api.post(`/orders/${id}/cancel`)
  return res.data
}

// Profile
export async function getProfile() {
  const res = await api.get('/account/profile')
  return res.data
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  const res = await api.patch('/account/profile', data)
  return res.data
}

// Addresses
export async function getAddresses() {
  const res = await api.get('/account/addresses')
  return res.data
}

// Search
export async function searchProducts(q: string) {
  const res = await api.get('/products', { params: { q } })
  return res.data
}
