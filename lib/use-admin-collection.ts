'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { fetchAdminCollection, saveAdminCollection } from '@/lib/api-client'

export function useAdminCollection<T extends { id: number }>(storageKey: string, seed: T[]) {
  const seeded = useRef(false)
  const [items, setItems] = useState<T[]>(seed)
  const { data, mutate, isLoading, error } = useSWR<T[]>(
    `admin/collections/${storageKey}`,
    () => fetchAdminCollection<T>(storageKey),
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (data === undefined) return
    setItems(data)
  }, [data])

  const persist = useCallback(async (next: T[]) => {
    setItems(next)
    const saved = await saveAdminCollection(storageKey, next)
    await mutate(saved, { revalidate: false })
    return saved
  }, [mutate, storageKey])

  useEffect(() => {
    if (isLoading || seeded.current || data === undefined) return
    if (data.length === 0 && seed.length > 0) {
      seeded.current = true
      void persist(seed)
    }
  }, [data, isLoading, persist, seed])

  const add = useCallback(async (item: Omit<T, 'id'>) => {
    const nextId = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1
    const next = [...items, { ...item, id: nextId } as T]
    return persist(next)
  }, [items, persist])

  const update = useCallback(async (id: number, patch: Partial<T>) => {
    const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i))
    return persist(next)
  }, [items, persist])

  const remove = useCallback(async (id: number) => {
    const next = items.filter((i) => i.id !== id)
    return persist(next)
  }, [items, persist])

  const ready = !isLoading && data !== undefined

  return { items, add, update, remove, ready, isLoading, error, mutate }
}
