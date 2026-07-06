'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const LS_KEY = 'mawrid_wishlist'

type WishlistCtx = {
  ids: string[]
  toggle: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  clear: () => void
  count: number
}

const Ctx = createContext<WishlistCtx>({
  ids: [],
  toggle: () => {},
  isWishlisted: () => false,
  clear: () => {},
  count: 0,
})

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setIds(JSON.parse(stored) as string[])
    } catch (e) {
      console.warn('[wishlist] corrupted storage; resetting', e)
      localStorage.removeItem(LS_KEY)
    }
  }, [])

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((x) => x !== productId)
        : [productId, ...prev]
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  )

  const clear = useCallback(() => {
    setIds([])
    try { localStorage.removeItem(LS_KEY) } catch {}
  }, [])

  return (
    <Ctx.Provider value={{ ids, toggle, isWishlisted, clear, count: ids.length }}>
      {children}
    </Ctx.Provider>
  )
}

export function useWishlist() {
  return useContext(Ctx)
}
