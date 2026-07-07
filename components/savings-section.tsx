'use client'

import Link from 'next/link'
import Image from 'next/image'
import { TrendingDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { marketSavingsPct } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { useProducts } from '@/lib/use-products'

export function SavingsSection() {
  const { t, lang, dir, formatPrice } = useI18n()
  const { products } = useProducts()

  const top = [...products]
    .sort((a, b) => marketSavingsPct(b) - marketSavingsPct(a))
    .slice(0, 4)

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-2xl border border-success/30 bg-success/5">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success text-success-foreground">
              <TrendingDown className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground text-balance">
                {t('mostSavings')}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                {t('mostSavingsDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {top.map((p) => {
            const pct = marketSavingsPct(p)
            return (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group flex items-center gap-3 bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={p.image || '/placeholder.svg'}
                    alt={lang === 'ar' ? p.nameAr : p.nameEn}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {lang === 'ar' ? p.nameAr : p.nameEn}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {formatPrice(p.basePrice)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(p.marketPrice)}
                    </span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                    -{pct}% {t('belowMarket')}
                    <Arrow className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
