'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, X, PackageSearch, Star, BadgeCheck, Tag } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  CATEGORIES,
  SUPPLIERS,
  marketSavingsPct,
  priceRangeUsd,
  type Product,
} from '@/lib/data'
import { ProductCard } from '@/components/product-card'
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'

type SortKey = 'savings' | 'priceLow' | 'priceHigh' | 'rating' | 'sold'

const SORTS: { key: SortKey; dictKey: 'sortSavings' | 'sortPriceLow' | 'sortPriceHigh' | 'sortRating' | 'sortSold' }[] = [
  { key: 'savings', dictKey: 'sortSavings' },
  { key: 'sold', dictKey: 'sortSold' },
  { key: 'priceLow', dictKey: 'sortPriceLow' },
  { key: 'priceHigh', dictKey: 'sortPriceHigh' },
  { key: 'rating', dictKey: 'sortRating' },
]

const PAGE_SIZE = 8

export function ProductBrowser({
  products,
  showCategoryFilter = false,
}: {
  products: Product[]
  showCategoryFilter?: boolean
}) {
  const { t, lang, formatPrice } = useI18n()

  const [minUsd, maxUsd] = useMemo(() => priceRangeUsd(products), [products])
  const supplierIds = useMemo(
    () => Array.from(new Set(products.map((p) => p.supplierId))),
    [products],
  )
  const categorySlugs = useMemo(
    () => Array.from(new Set(products.map((p) => p.categorySlug))),
    [products],
  )

  const [sort, setSort] = useState<SortKey>('savings')
  const [supplier, setSupplier] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [maxPrice, setMaxPrice] = useState<number>(maxUsd)
  const [minRating, setMinRating] = useState<number>(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (supplier !== 'all' && p.supplierId !== supplier) return false
      if (showCategoryFilter && category !== 'all' && p.categorySlug !== category) return false
      if (p.basePrice > maxPrice) return false
      if (minRating > 0 && p.rating < minRating) return false
      if (verifiedOnly && !p.verified) return false
      if (onSaleOnly && !p.oldPrice) return false
      return true
    })
    const sorted = [...list]
    switch (sort) {
      case 'savings':
        sorted.sort((a, b) => marketSavingsPct(b) - marketSavingsPct(a))
        break
      case 'priceLow':
        sorted.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'priceHigh':
        sorted.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'sold':
        sorted.sort((a, b) => b.sold - a.sold)
        break
    }
    return sorted
  }, [products, supplier, category, maxPrice, sort, showCategoryFilter, minRating, verifiedOnly, onSaleOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const hasActiveFilters =
    supplier !== 'all' || category !== 'all' || maxPrice < maxUsd ||
    minRating > 0 || verifiedOnly || onSaleOnly

  function resetFilters() {
    setSupplier('all')
    setCategory('all')
    setMaxPrice(maxUsd)
    setMinRating(0)
    setVerifiedOnly(false)
    setOnSaleOnly(false)
    setPage(1)
  }

  const filterPanel = (
    <div className="flex flex-col gap-5">
      {/* Suppliers */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-foreground">{t('supplier')}</legend>
        <div className="flex flex-col gap-1">
          <FilterRadio
            name="supplier"
            checked={supplier === 'all'}
            onChange={() => {
              setSupplier('all')
              setPage(1)
            }}
            label={t('allSuppliers')}
          />
          {supplierIds.map((id) => {
            const s = SUPPLIERS.find((x) => x.id === id)
            if (!s) return null
            return (
              <FilterRadio
                key={id}
                name="supplier"
                checked={supplier === id}
                onChange={() => {
                  setSupplier(id)
                  setPage(1)
                }}
                label={lang === 'ar' ? s.nameAr : s.nameEn}
              />
            )
          })}
        </div>
      </fieldset>

      {/* Category (search only) */}
      {showCategoryFilter && categorySlugs.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-foreground">{t('categories')}</legend>
          <div className="flex flex-col gap-1">
            <FilterRadio
              name="category"
              checked={category === 'all'}
              onChange={() => {
                setCategory('all')
                setPage(1)
              }}
              label={t('allCategories')}
            />
            {categorySlugs.map((slug) => {
              const c = CATEGORIES.find((x) => x.slug === slug)
              if (!c) return null
              return (
                <FilterRadio
                  key={slug}
                  name="category"
                  checked={category === slug}
                  onChange={() => {
                    setCategory(slug)
                    setPage(1)
                  }}
                  label={lang === 'ar' ? c.nameAr : c.nameEn}
                />
              )
            })}
          </div>
        </fieldset>
      )}

      {/* Price range */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-foreground">{t('priceRange')}</legend>
        <input
          type="range"
          min={minUsd}
          max={maxUsd}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value))
            setPage(1)
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('priceRange')}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(minUsd)}</span>
          <span className="font-bold text-foreground">{formatPrice(maxPrice)}</span>
        </div>
      </fieldset>

      {/* Min rating */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-foreground">
          {lang === 'ar' ? 'التقييم' : 'Rating'}
        </legend>
        <div className="flex flex-col gap-1">
          {[0, 3, 4, 4.5].map((val) => (
            <label
              key={val}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <input
                type="radio"
                name="minRating"
                checked={minRating === val}
                onChange={() => { setMinRating(val); setPage(1) }}
                className="size-4 accent-primary"
              />
              {val === 0 ? (
                <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {val}{'+'} {lang === 'ar' ? 'فأكثر' : '& up'}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Quick filters */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-foreground">
          {lang === 'ar' ? 'فلاتر سريعة' : 'Quick Filters'}
        </legend>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1) }}
              className="size-4 accent-primary rounded"
            />
            <BadgeCheck className="size-4 text-success" />
            {lang === 'ar' ? 'موردون موثوقون فقط' : 'Verified suppliers only'}
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent">
            <input
              type="checkbox"
              checked={onSaleOnly}
              onChange={(e) => { setOnSaleOnly(e.target.checked); setPage(1) }}
              className="size-4 accent-primary rounded"
            />
            <Tag className="size-4 text-primary" />
            {lang === 'ar' ? 'عروض وتخفيضات فقط' : 'On sale only'}
          </label>
        </div>
      </fieldset>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
          {t('clearFilters')}
        </button>
      )}
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
            <SlidersHorizontal className="size-4 text-primary" />
            {t('filters')}
          </h2>
          {filterPanel}
        </div>
      </aside>

      <div>
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              {t('filters')}
            </button>
            <span className="text-sm text-muted-foreground">
              {filtered.length} {t('results')}
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{t('sortBy')}</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey)
                setPage(1)
              }}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('sortBy')}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {t(s.dictKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Grid */}
        {pageItems.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={t('noResults')}
            description={t('noResultsDesc')}
            actionLabel={hasActiveFilters ? t('clearFilters') : undefined}
            onAction={hasActiveFilters ? resetFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pageItems.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <nav
            className="mt-6 flex items-center justify-center gap-2"
            aria-label={t('page')}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('prev')}
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === current ? 'page' : undefined}
                className={cn(
                  'grid size-10 place-items-center rounded-lg border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  n === current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-accent',
                )}
              >
                {n.toLocaleString(lang === 'ar' ? 'ar' : 'en-US')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={current === pageCount}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('next')}
            </button>
          </nav>
        )}
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
          />
          <div className="absolute inset-y-0 end-0 flex w-80 max-w-[85%] flex-col overflow-y-auto bg-card p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <SlidersHorizontal className="size-4 text-primary" />
                {t('filters')}
              </h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t('close')}
                className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mt-5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t('apply')} ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterRadio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span className="line-clamp-1">{label}</span>
    </label>
  )
}
