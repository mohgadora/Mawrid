'use client'

import { AlertTriangle, PackageCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface StockCounterProps {
  stock: number
  /** threshold below which the urgency badge shows */
  urgencyThreshold?: number
}

export function StockCounter({ stock, urgencyThreshold = 10 }: StockCounterProps) {
  const { lang } = useI18n()
  const isUrgent = stock <= urgencyThreshold

  if (!isUrgent) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-success">
        <PackageCheck className="size-4 shrink-0" />
        <span className="font-medium">
          {lang === 'ar' ? 'متوفر في المخزون' : 'In stock'}
        </span>
      </div>
    )
  }

  // Width as percentage (0-100) of urgency threshold
  const pct = Math.min(100, Math.round((stock / urgencyThreshold) * 100))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
        <span className="text-sm font-bold text-destructive">
          {lang === 'ar'
            ? `تبقّى ${stock} كرتون فقط!`
            : `Only ${stock} cartons left!`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-destructive transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={stock}
          aria-valuemin={0}
          aria-valuemax={urgencyThreshold}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {lang === 'ar'
          ? 'أسرع قبل نفاد المخزون'
          : 'Order soon before it sells out'}
      </p>
    </div>
  )
}
