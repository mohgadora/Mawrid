'use client'

import { useMemo } from 'react'
import { Activity, Lock, TrendingDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { marketHistory, type Product } from '@/lib/data'
import { cn } from '@/lib/utils'

const CONFIDENCE_KEY = {
  high: 'confidenceHigh',
  medium: 'confidenceMedium',
  low: 'confidenceLow',
} as const

/** Static demo 30-day sparkline. Logical (start/end) safe: uses a symmetric viewBox. */
function Sparkline({ points }: { points: number[] }) {
  const { path, area } = useMemo(() => {
    const w = 100
    const h = 32
    const min = Math.min(...points)
    const max = Math.max(...points)
    const span = max - min || 1
    const step = w / (points.length - 1)
    const coords = points.map((p, i) => {
      const x = i * step
      const y = h - ((p - min) / span) * (h - 4) - 2
      return [x, y] as const
    })
    const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
    const area = `${path} L${w},${h} L0,${h} Z`
    return { path, area }
  }, [points])

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-16 w-full"
      role="img"
      aria-hidden="true"
    >
      <path d={area} fill="var(--primary)" opacity={0.1} />
      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Comparison bar: market average vs. our price, scaled to the market max. */
function ComparisonBars({
  marketPrice,
  ourPrice,
}: {
  marketPrice: number
  ourPrice: number
}) {
  const { t, formatPrice } = useI18n()
  const ourPct = Math.max(6, Math.round((ourPrice / marketPrice) * 100))

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('marketAvg')}</span>
          <span className="font-semibold text-foreground">{formatPrice(marketPrice)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full rounded-full bg-muted-foreground/40" />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-success">{t('platformPrice')}</span>
          <span className="font-bold text-success">{formatPrice(ourPrice)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ inlineSize: `${ourPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function MarketIndicator({
  product,
  ourPrice,
  premiumUnlocked = false,
  className,
}: {
  product: Product
  /** The price to benchmark (best platform price by default). */
  ourPrice?: number
  premiumUnlocked?: boolean
  className?: string
}) {
  const { t, lang, formatPrice } = useI18n()
  const price = ourPrice ?? product.basePrice
  const history = useMemo(() => marketHistory(product), [product])
  const savingsPct = product.marketPrice > 0 ? Math.max(0, Math.round((1 - price / product.marketPrice) * 100)) : 0
  const savingsAmount = Math.max(0, product.marketPrice - price)

  const updated = new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(product.marketUpdatedAt))

  return (
    <section
      aria-label={t('marketIndicator')}
      className={cn('rounded-2xl border border-border bg-card p-4', className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Activity className="size-5 text-primary" />
          {t('marketIndicator')}
        </h2>
        {savingsPct > 0 && (
          <span className="rounded-md bg-success/15 px-2 py-1 text-xs font-bold text-success">
            {savingsPct}% {t('belowMarket')}
          </span>
        )}
      </div>

      {savingsAmount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/20 bg-success/10 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
            <TrendingDown className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-success/90">{t('marketSavings')}</p>
            <p className="truncate text-lg font-black tabular-nums text-success">
              {formatPrice(savingsAmount)}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-success px-2 py-1 text-xs font-bold text-success-foreground">
            −{savingsPct}%
          </span>
        </div>
      )}

      <ComparisonBars marketPrice={product.marketPrice} ourPrice={price} />

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('last30Days')}</p>
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          <div
            className={cn('flex min-h-24 items-center', !premiumUnlocked && 'blur-[3px]')}
            aria-hidden={!premiumUnlocked}
          >
            <Sparkline points={history} />
          </div>
          {!premiumUnlocked && (
            <div className="absolute inset-0 grid place-items-center bg-card/40 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-1.5 px-3 py-2 text-center">
                <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
                  <Lock className="size-4" />
                </span>
                <span className="text-xs font-semibold text-foreground text-balance">
                  {t('premiumLock')}
                </span>
                <button
                  type="button"
                  className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('unlockPremium')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {product.marketSources} {t('marketSources')} · {t('dataConfidence')}:{' '}
        {t(CONFIDENCE_KEY[product.marketConfidence])} · {t('lastUpdated')}: {updated}
      </p>
    </section>
  )
}
