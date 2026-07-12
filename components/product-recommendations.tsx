'use client'

import useSWR from 'swr'
import { Sparkles, Layers } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fetchRecommendations } from '@/lib/api-client'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/data'

/**
 * شريط توصيات حتمي (مشابه / يُشترى معاً / شخصي). لا يعرض شيئاً إن لم توجد نتائج.
 */
export function ProductRecommendations({
  type,
  productId,
}: {
  type: 'similar' | 'fbt' | 'personalized'
  productId?: string
}) {
  const { lang } = useI18n()
  const key = type === 'personalized' ? 'rec:personalized' : `rec:${type}:${productId}`
  const { data } = useSWR<Product[]>(key, () => fetchRecommendations(type, productId))

  if (!data?.length) return null

  const titles: Record<typeof type, { ar: string; en: string; icon: typeof Sparkles }> = {
    fbt: { ar: 'يُشترى عادةً معاً', en: 'Frequently bought together', icon: Layers },
    similar: { ar: 'منتجات مشابهة', en: 'Similar products', icon: Layers },
    personalized: { ar: 'مختارة لك', en: 'Picked for you', icon: Sparkles },
  }
  const meta = titles[type]
  const Icon = meta.icon

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </span>
        <h2 className="text-lg font-bold leading-tight text-foreground">{lang === 'ar' ? meta.ar : meta.en}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.slice(0, 5).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
