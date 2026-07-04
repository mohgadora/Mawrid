'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type SavedItem = { productId: string; qty: number }

type SavedContextValue = {
  saved: SavedItem[]
  saveItem: (productId: string, qty: number) => void
  removeFromSaved: (productId: string) => void
  isSaved: (productId: string) => boolean
}

const SavedContext = createContext<SavedContextValue | null>(null)

export function SaveForLaterProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mawrid_saved_for_later')
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('mawrid_saved_for_later', JSON.stringify(saved))
  }, [saved, loaded])

  const saveItem = useCallback((productId: string, qty: number) => {
    setSaved((prev) => {
      if (prev.find((i) => i.productId === productId)) return prev
      return [...prev, { productId, qty }]
    })
  }, [])

  const removeFromSaved = useCallback((productId: string) => {
    setSaved((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const isSaved = useCallback(
    (productId: string) => saved.some((i) => i.productId === productId),
    [saved],
  )

  const value = useMemo(
    () => ({ saved, saveItem, removeFromSaved, isSaved }),
    [saved, saveItem, removeFromSaved, isSaved],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export function useSaveForLater() {
  const ctx = useContext(SavedContext)
  if (!ctx) throw new Error('useSaveForLater must be used within SaveForLaterProvider')
  return ctx
}
