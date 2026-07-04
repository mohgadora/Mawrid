'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'

const MAX_COMPARE = 3

type CompareCtx = {
  ids: string[]
  toggle: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clear: () => void
  count: number
  isFull: boolean
}

const Ctx = createContext<CompareCtx>({
  ids: [],
  toggle: () => {},
  isInCompare: () => false,
  clear: () => {},
  count: 0,
  isFull: false,
})

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      if (prev.includes(productId)) return prev.filter((x) => x !== productId)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, productId]
    })
  }, [])

  const isInCompare = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  )

  const clear = useCallback(() => setIds([]), [])

  return (
    <Ctx.Provider value={{ ids, toggle, isInCompare, clear, count: ids.length, isFull: ids.length >= MAX_COMPARE }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCompare() {
  return useContext(Ctx)
}
