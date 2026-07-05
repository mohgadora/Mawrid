'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

/**
 * Premium subscription state. Replaces the hardcoded `premiumUnlocked={false}`
 * that used to be passed into <MarketIndicator />. In a real backend this would
 * be read from the user's subscription record; here it is persisted locally so
 * the unlock action actually sticks.
 */
type SubscriptionContextValue = {
  premiumUnlocked: boolean
  loading: boolean
  subscribe: () => void
  cancel: () => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

const STORAGE_KEY = 'mawrid_premium'

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [premiumUnlocked, setPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPremium(localStorage.getItem(STORAGE_KEY) === '1')
    setLoading(false)
  }, [])

  const subscribe = useCallback(() => {
    setPremium(true)
    localStorage.setItem(STORAGE_KEY, '1')
  }, [])

  const cancel = useCallback(() => {
    setPremium(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ premiumUnlocked, loading, subscribe, cancel }),
    [premiumUnlocked, loading, subscribe, cancel],
  )

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
