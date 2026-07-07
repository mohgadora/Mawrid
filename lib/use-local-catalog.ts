'use client'

import { useCallback, useEffect, useState } from 'react'

export function useLocalCatalog<T extends { id: number }>(storageKey: string, initial: T[]) {
  const [items, setItems] = useState<T[]>(initial)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw) as T[])
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true)
  }, [storageKey])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey, ready])

  const add = useCallback((item: Omit<T, 'id'>) => {
    setItems((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((i) => i.id)) + 1 : 1
      return [...prev, { ...item, id: nextId } as T]
    })
  }, [])

  const update = useCallback((id: number, patch: Partial<T>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { items, add, update, remove, ready }
}
