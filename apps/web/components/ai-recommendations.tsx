'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { useRecentlyViewed } from '@/lib/recently-viewed'
import { ProductCard } from '@/components/product-card'
import { ProductCardSkeleton } from '@/components/skeletons'
import type { Product } from '@/lib/data'

export function AiRecommendations() {
  const { lang } = useI18n()
  const { role } = useRole()
  const { ids: recentIds } = useRecentlyViewed()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback')
  const [refreshKey, setRefreshKey] = useState(0)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recentIds, role, lang }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setProducts(data.products ?? [])
        setSource(data.source ?? 'fallback')
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, refreshKey])

  if (!loading && products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {t('مختار لك بالذكاء الاصطناعي', 'AI-Picked For You')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {source === 'ai'
                ? t('مقترحات مخصصة بناء على تصفحك وعملك', 'Personalized to your role and browsing history')
                : t('الأكثر مبيعاً في المنصة', 'Top sellers on the platform')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          aria-label={t('تحديث الاقتراحات', 'Refresh recommendations')}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('تحديث', 'Refresh')}
        </button>
      </div>

      {/* AI badge ribbon */}
      {source === 'ai' && !loading && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Sparkles className="size-3.5 shrink-0" />
          {role === 'merchant'
            ? t('هذه المنتجات مختارة لك كتاجر جملة — تشكيلات عالية الربحية', 'Selected for you as a merchant — high-margin wholesale assortments')
            : t('مقترحات يومية مناسبة لك كمستهلك', 'Daily picks tailored for individual consumers')}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
