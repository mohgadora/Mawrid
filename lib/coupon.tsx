'use client'

import { useCallback, useEffect, useState } from 'react'

export type AppliedCoupon = {
  code: string
  discountUsd: number
  freeShipping: boolean
}

const STORAGE_KEY = 'mawrid_coupon'

/**
 * Client-side store for the coupon the shopper applied in the cart, so it
 * survives the trip to /checkout. The discount shown is an estimate — the
 * server recomputes the authoritative discount when the order is placed.
 */
export function useCoupon() {
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCoupon(JSON.parse(raw) as AppliedCoupon)
    } catch {}
    setLoaded(true)
  }, [])

  const applyCoupon = useCallback((c: AppliedCoupon) => {
    setCoupon(c)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    } catch {}
  }, [])

  const clearCoupon = useCallback(() => {
    setCoupon(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  return { coupon, applyCoupon, clearCoupon, loaded }
}
