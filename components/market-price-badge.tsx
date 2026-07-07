'use client'

import { TrendingDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Product } from '@/lib/data'
import { InfoTooltip } from '@/components/info-tooltip'
import { cn } from '@/lib/utils'

const CONFIDENCE_KEY = {
  high: 'confidenceHigh',
  medium: 'confidenceMedium',
  low: 'confidenceLow',
} as const

/**
 * Shows "cheaper than market by X%" — ONLY when the given price beats the
 * surveyed market average. Never renders the inverse.
 */
export function MarketPriceBadge({
  product,
  price,
  size = 'md',
  className,
}: {
  product: Product
  /** Price to compare (defaults to the best platform price). */
  price?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const { t, lang, formatPrice } = useI18n()
  const compare = price ?? product.basePrice
  if (!product.marketPrice || product.marketPrice <= 0) return null
  const pct = Math.round((1 - compare / product.marketPrice) * 100)

  // Only surface savings, never a loss.
  if (compare >= product.marketPrice || pct <= 0) return null

  const updated = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(product.marketUpdatedAt))

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-success/15 font-bold text-success',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        className,
      )}
    >
      <TrendingDown className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      <span>
        {t('cheaperThanMarket')} {pct}%
      </span>
      <InfoTooltip
        label={t('marketIndicator')}
        iconClassName={size === 'sm' ? 'size-3' : 'size-3.5'}
      >
        <span className="flex flex-col gap-0.5">
          <span>
            {t('marketAvg')}: <b>{formatPrice(product.marketPrice)}</b>
          </span>
          <span>
            {product.marketSources} {t('marketSources')} · {t('dataConfidence')}:{' '}
            {t(CONFIDENCE_KEY[product.marketConfidence])}
          </span>
          <span className="text-muted-foreground">
            {t('lastUpdated')}: {updated}
          </span>
        </span>
      </InfoTooltip>
    </span>
  )
}
