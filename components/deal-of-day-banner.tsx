'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fetchTodayDeal, type TodayDeal } from '@/lib/api-client'

export function DealOfDayBanner() {
  const { lang, dir, formatPrice } = useI18n()
  const { data } = useSWR<TodayDeal>('deals/today', fetchTodayDeal)
  if (!data) return null

  const title = (lang === 'ar' ? data.titleAr : data.titleEn) || data.titleAr
  const pct = data.discountType === 'percent'
    ? Math.round(data.discount)
    : data.basePrice > 0 ? Math.round((data.discount / data.basePrice) * 100) : 0

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <Link
        href={`/product/${data.productId}`}
        className="flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-l from-primary/10 to-transparent p-4 transition-colors hover:from-primary/15"
      >
        <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
          {data.image && <Image src={data.image} alt={data.productName} fill sizes="96px" className="object-cover" />}
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
            <Zap className="size-3" /> {lang === 'ar' ? 'عرض اليوم' : 'Deal of the day'}
          </span>
          <p className="mt-1 truncate text-base font-black text-foreground">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{data.productName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-black text-primary">{formatPrice(data.salePrice)}</span>
            <span className="text-sm text-muted-foreground line-through">{formatPrice(data.basePrice)}</span>
            {pct > 0 && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-bold text-destructive">-{pct}%</span>}
          </div>
        </div>
        <ArrowLeft className={`size-5 shrink-0 text-primary ${dir === 'ltr' ? 'rotate-180' : ''}`} />
      </Link>
    </section>
  )
}
