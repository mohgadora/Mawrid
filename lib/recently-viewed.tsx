'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const MAX_ITEMS = 10
const LS_KEY = 'recently_viewed'

type RecentlyViewedCtx = {
  ids: string[]
  push: (id: string) => void
  clear: () => void
}

const Ctx = createContext<RecentlyViewedCtx>({
  ids: [],
  push: () => {},
  clear: () => {},
})

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  // Hydrate from localStorage after mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setIds(JSON.parse(stored) as string[])
    } catch (e) {
      console.warn('[recently-viewed] corrupted storage; resetting', e)
      localStorage.removeItem(LS_KEY)
    }
  }, [])

  const push = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_ITEMS)
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setIds([])
    try { localStorage.removeItem(LS_KEY) } catch {}
  }, [])

  return <Ctx.Provider value={{ ids, push, clear }}>{children}</Ctx.Provider>
}

export function useRecentlyViewed() {
  return useContext(Ctx)
}
