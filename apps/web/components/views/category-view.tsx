'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { ChevronLeft, PackageSearch } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { getCategoryWithProducts, type CategoryResult } from '@/services/catalog'
import { CategoryIcon } from '@/components/category-icon'
import { ProductBrowser } from '@/components/product-browser'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { ProductGridSkeleton } from '@/components/skeletons'

export function CategoryView({ slug }: { slug: string }) {
  const { t, lang, dir } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<CategoryResult>(
    ['category', slug],
    () => getCategoryWithProducts(slug),
  )

  const categoryName =
    data?.category && (lang === 'ar' ? data.category.nameAr : data.category.nameEn)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t('backToHome')}
        </Link>
        <ChevronLeft className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        <span className="text-foreground">{categoryName ?? t('categories')}</span>
      </nav>

      {data?.category && (
        <header className="mb-6 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <CategoryIcon name={data.category.icon} className="size-6 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-foreground">{categoryName}</h1>
            <p className="text-sm text-muted-foreground">
              {data.products.length} {t('results')}
            </p>
          </div>
        </header>
      )}

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={<ProductGridSkeleton count={8} />}
        isEmpty={(d) => d.category === null || d.products.length === 0}
        empty={
          <EmptyState
            icon={PackageSearch}
            title={t('noResults')}
            description={t('noResultsDesc')}
            actionLabel={t('backToHome')}
            actionHref="/"
          />
        }
      >
        {(d) => <ProductBrowser products={d.products} />}
      </AsyncContent>
    </div>
  )
}
