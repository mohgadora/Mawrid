'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Zap, ChevronLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { ProductCard } from '@/components/product-card'
import { useProducts } from '@/lib/use-products'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function Countdown() {
  // Counts down to the next midnight.
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    function tick() {
      const now = new Date()
      const end = new Date(now)
      end.setHours(24, 0, 0, 0)
      setRemaining(Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[h, m, s].map((v, i) => (
        <span
          key={i}
          className="grid min-w-7 place-items-center rounded-md bg-foreground px-1 py-0.5 text-sm font-bold text-background tabular-nums"
        >
          {pad(v)}
        </span>
      ))}
    </div>
  )
}

export function DealsSection() {
  const { t, dir } = useI18n()
  const { products } = useProducts()
  const deals = products.filter((p) => p.oldPrice).slice(0, 6)
  const Chevron = ChevronLeft

  return (
    <section id="deals" className="mx-auto max-w-7xl px-4 pt-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-accent/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-5 fill-current" />
            </span>
            <h2 className="text-lg font-black text-primary">{t('flashDeals')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t('endsIn')}</span>
            <Countdown />
          </div>
          <Link
            href="#products"
            className="ms-auto flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
          >
            {t('seeAll')}
            <Chevron className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
