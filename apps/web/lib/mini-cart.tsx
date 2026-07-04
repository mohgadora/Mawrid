'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type MiniCartContextValue = {
  open: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const MiniCartContext = createContext<MiniCartContextValue | null>(null)

export function MiniCartProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openCart = useCallback(() => setOpen(true), [])
  const closeCart = useCallback(() => setOpen(false), [])
  const toggleCart = useCallback(() => setOpen((o) => !o), [])

  const value = useMemo(
    () => ({ open, openCart, closeCart, toggleCart }),
    [open, openCart, closeCart, toggleCart],
  )

  return <MiniCartContext.Provider value={value}>{children}</MiniCartContext.Provider>
}

export function useMiniCart() {
  const ctx = useContext(MiniCartContext)
  if (!ctx) throw new Error('useMiniCart must be used within MiniCartProvider')
  return ctx
}
