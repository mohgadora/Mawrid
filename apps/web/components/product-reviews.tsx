'use client'

import { useState } from 'react'
import { Star, ThumbsUp, BadgeCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Review = {
  id: string
  author: string
  verified: boolean
  rating: number
  date: string
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  helpful: number
  role: 'merchant' | 'consumer'
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'محمد العتيبي',
    verified: true,
    rating: 5,
    date: '2024-06-20',
    titleAr: 'جودة ممتازة وتوصيل سريع',
    titleEn: 'Excellent quality and fast delivery',
    bodyAr: 'المنتج مطابق للمواصفات تماماً، الكرتون محكم التغليف والكميات دقيقة. سأطلب مرة أخرى بالتأكيد.',
    bodyEn: 'Product matches specs perfectly. Cartons were well packed and quantities accurate. Will order again.',
    helpful: 12,
    role: 'merchant',
  },
  {
    id: '2',
    author: 'سارة الزهراني',
    verified: true,
    rating: 4,
    date: '2024-06-10',
    titleAr: 'جيد جداً مع ملاحظة بسيطة',
    titleEn: 'Very good with a minor note',
    bodyAr: 'المنتج ممتاز والسعر تنافسي. التوصيل تأخر يوماً واحداً عن الموعد المحدد.',
    bodyEn: 'Product is excellent and price competitive. Delivery was one day late.',
    helpful: 7,
    role: 'merchant',
  },
  {
    id: '3',
    author: 'خالد المطيري',
    verified: false,
    rating: 5,
    date: '2024-05-28',
    titleAr: 'أنصح به بشدة',
    titleEn: 'Highly recommended',
    bodyAr: 'ثالث مرة أطلب من هذا المورد. الجودة ثابتة والدعم ممتاز.',
    bodyEn: 'Third time ordering from this supplier. Consistent quality and great support.',
    helpful: 21,
    role: 'consumer',
  },
]

const DIST = [
  { stars: 5, pct: 72 },
  { stars: 4, pct: 18 },
  { stars: 3, pct: 7 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
]

function StarRow({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${filled} out of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < filled ? 'fill-chart-3 text-chart-3' : 'fill-muted text-muted',
          )}
        />
      ))}
    </span>
  )
}

export function ProductReviews({ rating, sold }: { rating: number; sold: number }) {
  const { lang } = useI18n()
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({})

  function toggleHelpful(id: string) {
    setHelpfulMap((m) => ({ ...m, [id]: !m[id] }))
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {lang === 'ar' ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}
      </h2>

      {/* Summary */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        {/* Big rating */}
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-accent/50 px-8 py-4 sm:shrink-0">
          <span className="text-5xl font-black tabular-nums text-foreground">{rating}</span>
          <StarRow filled={Math.round(rating)} />
          <span className="mt-1 text-xs text-muted-foreground">
            {sold.toLocaleString(lang === 'ar' ? 'ar' : 'en-US')}{' '}
            {lang === 'ar' ? 'مبيع' : 'sold'}
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex flex-1 flex-col gap-1.5">
          {DIST.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-end text-muted-foreground tabular-nums">
                {stars}
              </span>
              <Star className="size-3 shrink-0 fill-chart-3 text-chart-3" />
              <div className="flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-1.5 rounded-full bg-chart-3 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-muted-foreground tabular-nums">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review list */}
      <ul className="flex flex-col divide-y divide-border">
        {MOCK_REVIEWS.map((r) => {
          const didHelpful = helpfulMap[r.id]
          const helpfulCount = r.helpful + (didHelpful ? 1 : 0)
          return (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {r.author.charAt(0)}
                </span>
                <span className="font-semibold text-foreground text-sm">{r.author}</span>
                {r.verified && (
                  <span className="flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <BadgeCheck className="size-3" />
                    {lang === 'ar' ? 'شراء موثّق' : 'Verified purchase'}
                  </span>
                )}
                <span className="ms-auto text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <StarRow filled={r.rating} />

              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {lang === 'ar' ? r.titleAr : r.titleEn}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                {lang === 'ar' ? r.bodyAr : r.bodyEn}
              </p>

              <button
                onClick={() => toggleHelpful(r.id)}
                className={cn(
                  'mt-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  didHelpful
                    ? 'border-primary/40 bg-primary/8 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                <ThumbsUp className="size-3" />
                {lang === 'ar' ? `مفيد (${helpfulCount})` : `Helpful (${helpfulCount})`}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
