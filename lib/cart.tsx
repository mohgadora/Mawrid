'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// ── Product snapshot stored inside each cart item ─────────────────────────

export type CartProductSnapshot = {
  id:             string
  nameAr:         string
  nameEn:         string
  image:          string
  supplierId:     string
  supplierAr:     string
  supplierEn:     string
  unitsPerCarton: number
  moq:            number
  basePrice:      number
  marketPrice:    number
  tiers:          { minQty: number; pricePerCarton: number }[]
  verified:       boolean
}

export type CartItem = {
  productId: string
  qty:       number
  variantId?: string
  variantLabel?: string
  /** Full product snapshot captured at add-to-cart time. Never stale for the session. */
  snapshot?: CartProductSnapshot
}

// ── Price helpers (no lib/data dependency) ────────────────────────────────

export function priceForQtySnapshot(snapshot: CartProductSnapshot, qty: number): number {
  const sorted = [...snapshot.tiers].sort((a, b) => b.minQty - a.minQty)
  for (const tier of sorted) {
    if (qty >= tier.minQty) return tier.pricePerCarton
  }
  return snapshot.basePrice
}

export function marketSavingsSnapshot(snapshot: CartProductSnapshot, unitPrice: number, qty: number): number {
  if (!snapshot.marketPrice) return 0
  return Math.max(0, (snapshot.marketPrice - unitPrice) * qty)
}

import { RETAIL_MARKUP } from '@/lib/config'

export function retailPriceSnapshot(snapshot: CartProductSnapshot): number {
  return Math.round(snapshot.basePrice * RETAIL_MARKUP)
}

export function priceForRoleSnapshot(snapshot: CartProductSnapshot, qty: number, role: string): number {
  return role === 'merchant' ? priceForQtySnapshot(snapshot, qty) : retailPriceSnapshot(snapshot)
}

// ── Context type ──────────────────────────────────────────────────────────

type CartContextValue = {
  items:          CartItem[]
  count:          number
  /** Add item with full snapshot (preferred — use when you have the Product object). */
  addItem:        (product: CartProductSnapshot, qty: number, variantId?: string, variantLabel?: string) => void
  /** Add item by ID only (reorder paths where only ID + qty are available). */
  addItemById:    (productId: string, qty: number) => void
  updateQty:      (productId: string, qty: number, variantId?: string) => void
  removeItem:     (productId: string, variantId?: string) => void
  clear:          () => void
  mergeServerCart:(serverItems: { productId: string; qty: number }[]) => void
  subtotalUsd:    number
}

const CartContext = createContext<CartContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]   = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mawrid_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (loaded) localStorage.setItem('mawrid_cart', JSON.stringify(items))
  }, [items, loaded])

  // Cart key: productId + variantId (undefined for non-variant items)
  const cartKey = (productId: string, variantId?: string) => `${productId}::${variantId ?? ''}`

  const addItem = useCallback((product: CartProductSnapshot, qty: number, variantId?: string, variantLabel?: string) => {
    setItems((prev) => {
      const key = cartKey(product.id, variantId)
      const existing = prev.find((i) => cartKey(i.productId, i.variantId) === key)
      if (existing) {
        return prev.map((i) =>
          cartKey(i.productId, i.variantId) === key
            ? { ...i, qty: i.qty + qty, snapshot: product }
            : i,
        )
      }
      return [...prev, { productId: product.id, qty, snapshot: product, variantId, variantLabel }]
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mawrid:open-mini-cart'))
    }
  }, [])

  const addItemById = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId && !i.variantId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId && !i.variantId ? { ...i, qty: i.qty + qty } : i,
        )
      }
      return [...prev, { productId, qty }]
    })
  }, [])

  const updateQty = useCallback((productId: string, qty: number, variantId?: string) => {
    const key = cartKey(productId, variantId)
    setItems((prev) =>
      prev.map((i) =>
        cartKey(i.productId, i.variantId) === key ? { ...i, qty: Math.max(1, qty) } : i,
      ),
    )
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    const key = cartKey(productId, variantId)
    setItems((prev) => prev.filter((i) => cartKey(i.productId, i.variantId) !== key))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  // Merge server cart — keeps snapshots from existing items if present
  const mergeServerCart = useCallback(
    (serverItems: { productId: string; qty: number }[]) => {
      setItems((prev) => {
        const merged = new Map<string, CartItem>()
        for (const i of prev) merged.set(i.productId, i)
        for (const s of serverItems) {
          const existing = merged.get(s.productId)
          merged.set(s.productId, {
            productId: s.productId,
            qty:       (existing?.qty ?? 0) + s.qty,
            snapshot:  existing?.snapshot,
          })
        }
        return Array.from(merged.values())
      })
    },
    [],
  )

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  const subtotalUsd = useMemo(() => {
    return items.reduce((sum, i) => {
      if (!i.snapshot) return sum
      const unit = priceForQtySnapshot(i.snapshot, i.qty)
      return sum + unit * i.qty
    }, 0)
  }, [items])

  const value = useMemo(
    () => ({ items, count, addItem, addItemById, updateQty, removeItem, clear, mergeServerCart, subtotalUsd }),
    [items, count, addItem, addItemById, updateQty, removeItem, clear, mergeServerCart, subtotalUsd],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

// ── Convenience: convert lib/data Product → CartProductSnapshot ───────────

export function toCartSnapshot(product: {
  id: string
  nameAr: string
  nameEn: string
  image: string
  supplierId: string
  supplierAr: string
  supplierEn: string
  unitsPerCarton: number
  moq: number
  basePrice: number
  marketPrice: number
  tiers: { minQty: number; pricePerCarton: number }[]
  verified: boolean
}): CartProductSnapshot {
  return {
    id:             product.id,
    nameAr:         product.nameAr,
    nameEn:         product.nameEn,
    image:          product.image,
    supplierId:     product.supplierId,
    supplierAr:     product.supplierAr,
    supplierEn:     product.supplierEn,
    unitsPerCarton: product.unitsPerCarton,
    moq:            product.moq,
    basePrice:      product.basePrice,
    marketPrice:    product.marketPrice,
    tiers:          product.tiers,
    verified:       product.verified,
  }
}
