'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { PackageSearch } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { ProductCard } from '@/components/product-card'
import { useProducts } from '@/lib/use-products'

export function ProductGrid() {
  const { t, lang } = useI18n()
  const params = useSearchParams()
  const cat = params.get('cat')
  const q = params.get('q')?.toLowerCase().trim()
  const { products: PRODUCTS, isLoading, error } = useProducts()

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (cat && p.categorySlug !== cat) return false
      if (q) {
        const haystack = [
          p.nameAr,
          p.nameEn,
          p.supplierAr,
          p.supplierEn,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [cat, q])

  const activeCat = CATEGORIES.find((c) => c.slug === cat)

  const heading = q
    ? `${t('search')}: "${q}"`
    : activeCat
      ? lang === 'ar'
        ? activeCat.nameAr
        : activeCat.nameEn
      : t('recommended')

  return (
    <section id="products" className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{heading}</h2>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {t('items')}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{t('errorTitle')}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <PackageSearch className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'لا توجد منتجات مطابقة' : 'No matching products'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
