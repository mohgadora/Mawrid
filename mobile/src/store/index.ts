import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { I18nManager } from 'react-native'

export type Lang = 'ar' | 'en'
export type Currency = 'SAR' | 'USD' | 'AED' | 'EGP'

export type CartItem = {
  id: string
  productId: string
  name: string
  nameAr: string
  price: number
  imageUrl: string | null
  quantity: number
  unit: string
}

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
}

type AppStore = {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User | null, token: string | null) => void
  logout: () => void

  // Language
  lang: Lang
  setLang: (lang: Lang) => void

  // Currency
  currency: Currency
  setCurrency: (currency: Currency) => void

  // Cart
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clearCart: () => void
  cartTotal: () => number
  cartCount: () => number
}

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user, token) => {
    set({ user, token, isAuthenticated: !!user })
    if (token) {
      AsyncStorage.setItem('auth_token', token)
      AsyncStorage.setItem('auth_user', JSON.stringify(user))
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, cart: [] })
    AsyncStorage.removeItem('auth_token')
    AsyncStorage.removeItem('auth_user')
  },

  lang: 'ar',
  setLang: (lang) => {
    set({ lang })
    AsyncStorage.setItem('app_lang', lang)
  },

  currency: 'SAR',
  setCurrency: (currency) => {
    set({ currency })
    AsyncStorage.setItem('app_currency', currency)
  },

  cart: [],

  addToCart: (item) => {
    const { cart } = get()
    const existing = cart.find((c) => c.productId === item.productId)
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.productId === item.productId
            ? { ...c, quantity: c.quantity + (item.quantity ?? 1) }
            : c
        ),
      })
    } else {
      set({ cart: [...cart, { ...item, quantity: item.quantity ?? 1 }] })
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.productId !== productId) })
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId)
      return
    }
    set({
      cart: get().cart.map((c) =>
        c.productId === productId ? { ...c, quantity: qty } : c
      ),
    })
  },

  clearCart: () => set({ cart: [] }),

  cartTotal: () =>
    get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

  cartCount: () =>
    get().cart.reduce((sum, item) => sum + item.quantity, 0),
}))
