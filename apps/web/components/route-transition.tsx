'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Gently fades/slides route content in on navigation so transitions feel smooth
 * instead of a hard swap. Purely presentational — it never blocks interaction
 * and fully respects `prefers-reduced-motion` (the animation collapses to a
 * no-op via the `.route-fade` utility in globals.css).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [key, setKey] = useState(pathname)
  const first = useRef(true)

  useEffect(() => {
    // Skip animating the very first paint to avoid a redundant intro flash.
    if (first.current) {
      first.current = false
      return
    }
    setKey(pathname)
  }, [pathname])

  return (
    <div key={key} className="route-fade">
      {children}
    </div>
  )
}
