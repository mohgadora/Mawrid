'use client'

import useSWR from 'swr'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, SearchX, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { searchProductsApi } from '@/lib/api-client'
import type { Product } from '@/lib/data'
import { ProductCard } from '@/components/product-card'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { ProductGridSkeleton } from '@/components/skeletons'
import { useState, useCallback } from 'react'

type SearchResult = { products: Product[]; total: number; page: number; totalPages: number }

const SORT_OPTIONS = [
  { value: 'relevance', labelAr: 'الأكثر صلة' },
  { value: 'newest', labelAr: 'الأحدث' },
  { value: 'price_asc', labelAr: 'السعر: الأقل أولاً' },
  { value: 'price_desc', labelAr: 'السعر: الأعلى أولاً' },
  { value: 'rating', labelAr: 'التقييم' },
] as const

export function SearchView() {
  const { t } = useI18n()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const query = (params.get('q') ?? '').trim()
  const category = params.get('category') ?? ''
  const sortBy = params.get('sortBy') ?? 'relevance'
  const page = Number(params.get('page') ?? '1')
  const inStock = params.get('inStock') === 'true'
  const minPriceParam = params.get('minPrice') ?? ''
  const maxPriceParam = params.get('maxPrice') ?? ''

  const [minPriceInput, setMinPriceInput] = useState(minPriceParam)
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam)
  const [showFilters, setShowFilters] = useState(false)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null || value === '') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      next.delete('page') // reset pagination on filter change
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router],
  )

  const swrKey = query || category || inStock || minPriceParam || maxPriceParam
    ? ['search-advanced', query, category, sortBy, page, inStock, minPriceParam, maxPriceParam]
    : null

  const { data, error, isLoading, mutate } = useSWR<SearchResult>(
    swrKey,
    () =>
      searchProductsApi({
        q: query || undefined,
        category: category || undefined,
        sortBy: sortBy || undefined,
        page,
        inStock: inStock || undefined,
        minPrice: minPriceParam ? Number(minPriceParam) : undefined,
        maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
        limit: 24,
      }),
  )

  if (!query && !category && !inStock && !minPriceParam && !maxPriceParam) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10" dir="rtl">
        <EmptyState
          icon={Search}
          title={t('searchPrompt')}
          description={t('searchPromptDesc')}
          actionLabel={t('backToHome')}
          actionHref="/"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" dir="rtl">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          {query && (
            <>
              <p className="text-sm text-muted-foreground">نتائج البحث عن</p>
              <h1 className="text-2xl font-black text-foreground text-balance">&ldquo;{query}&rdquo;</h1>
            </>
          )}
          {!query && <h1 className="text-2xl font-black text-foreground">تصفح المنتجات</h1>}
          {data && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.total} منتج
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <SlidersHorizontal size={16} />
          فلترة
        </button>
      </header>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        {showFilters && (
          <aside className="w-64 shrink-0 space-y-6 rounded-xl border border-border bg-card p-4 h-fit sticky top-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">الترتيب</h3>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">نطاق السعر (ر.س)</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="من"
                  min={0}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onBlur={() => updateParam('minPrice', minPriceInput)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  placeholder="إلى"
                  min={0}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onBlur={() => updateParam('maxPrice', maxPriceInput)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
                  className="rounded"
                />
                <span className="text-sm font-medium">متاح فقط</span>
              </label>
            </div>

            {/* Reset filters */}
            <button
              onClick={() => {
                setMinPriceInput('')
                setMaxPriceInput('')
                const next = new URLSearchParams()
                if (query) next.set('q', query)
                router.push(`${pathname}?${next.toString()}`)
              }}
              className="text-sm text-primary hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Sort bar (compact) */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.labelAr}
                </option>
              ))}
            </select>
          </div>

          <AsyncContent
            data={data}
            error={error}
            isLoading={isLoading}
            onRetry={() => mutate()}
            loading={<ProductGridSkeleton count={12} />}
            isEmpty={(d) => d.products.length === 0}
            empty={
              <div className="flex flex-col items-center gap-6 py-10">
                <Image src="/placeholder.svg" alt="" width={160} height={160} className="opacity-60" />
                <EmptyState
                  icon={SearchX}
                  title={t('noSearchResults')}
                  description={t('noSearchResultsDesc')}
                  actionLabel={t('backToHome')}
                  actionHref="/"
                  className="w-full"
                />
              </div>
            }
          >
            {(d) => (
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {d.products.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {d.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      disabled={d.page <= 1}
                      onClick={() => updateParam('page', String(d.page - 1))}
                      className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      <ChevronRight size={16} />
                      السابق
                    </button>
                    <span className="text-sm text-muted-foreground px-4">
                      {d.page} / {d.totalPages}
                    </span>
                    <button
                      disabled={d.page >= d.totalPages}
                      onClick={() => updateParam('page', String(d.page + 1))}
                      className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      التالي
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </AsyncContent>
        </div>
      </div>
    </div>
  )
}
