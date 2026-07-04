'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

interface FlashSaleBadgeProps {
  /** end time in ms (epoch). defaults to next midnight */
  endsAt?: number
  size?: 'sm' | 'md'
}

export function FlashSaleBadge({ endsAt, size = 'md' }: FlashSaleBadgeProps) {
  const { lang } = useI18n()
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function tick() {
      const target = endsAt ?? (() => {
        const end = new Date()
        end.setHours(24, 0, 0, 0)
        return end.getTime()
      })()
      setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  const endsInLabel = lang === 'ar' ? 'ينتهي خلال' : 'Ends in'

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5">
        <Zap className="size-2.5 fill-destructive text-destructive" />
        <span className="text-[10px] font-bold text-destructive" dir="ltr">
          {pad(h)}:{pad(m)}:{pad(s)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
      <Zap className="size-4 fill-destructive text-destructive" />
      <span className="text-xs font-semibold text-destructive">{endsInLabel}</span>
      <div className="flex items-center gap-0.5" dir="ltr">
        {[h, m, s].map((v, i) => (
          <span key={i}>
            <span className="rounded bg-destructive px-1 py-0.5 text-xs font-bold text-destructive-foreground tabular-nums">
              {pad(v)}
            </span>
            {i < 2 && <span className="mx-0.5 text-xs font-bold text-destructive">:</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
