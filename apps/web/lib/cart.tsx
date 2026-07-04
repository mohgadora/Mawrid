'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getProduct, priceForQty } from './data'

export type CartItem = { productId: string; qty: number }

type CartContextValue = {
  items: CartItem[]
  count: number
  addItem: (productId: string, qty: number) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  /** Merge a server-side (returning user) cart into the current guest cart. */
  mergeServerCart: (serverItems: CartItem[]) => void
  subtotalUsd: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mawrid_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('mawrid_cart', JSON.stringify(items))
  }, [items, loaded])

  const addItem = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + qty } : i,
        )
      }
      return [...prev, { productId, qty }]
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mawrid:open-mini-cart'))
    }
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i)),
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const mergeServerCart = useCallback((serverItems: CartItem[]) => {
    setItems((prev) => {
      const merged = new Map<string, number>()
      for (const i of prev) merged.set(i.productId, i.qty)
      for (const s of serverItems) {
        merged.set(s.productId, (merged.get(s.productId) ?? 0) + s.qty)
      }
      return Array.from(merged, ([productId, qty]) => ({ productId, qty }))
    })
  }, [])

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  const subtotalUsd = useMemo(() => {
    return items.reduce((sum, i) => {
      const product = getProduct(i.productId)
      if (!product) return sum
      return sum + priceForQty(product, i.qty) * i.qty
    }, 0)
  }, [items])

  const value = useMemo(
    () => ({ items, count, addItem, updateQty, removeItem, clear, mergeServerCart, subtotalUsd }),
    [items, count, addItem, updateQty, removeItem, clear, mergeServerCart, subtotalUsd],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
