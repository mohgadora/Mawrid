'use client'

import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Search, SearchX } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { searchProducts } from '@/services/catalog'
import type { Product } from '@/lib/data'
import { ProductBrowser } from '@/components/product-browser'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { ProductGridSkeleton } from '@/components/skeletons'

export function SearchView() {
  const { t } = useI18n()
  const params = useSearchParams()
  const query = (params.get('q') ?? '').trim()

  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    query ? ['search', query] : null,
    () => searchProducts(query),
  )

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
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
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">{t('searchResultsFor')}</p>
        <h1 className="text-2xl font-black text-foreground text-balance">&ldquo;{query}&rdquo;</h1>
      </header>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={<ProductGridSkeleton count={8} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/placeholder.svg"
              alt=""
              width={160}
              height={160}
              className="opacity-60"
            />
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
        {(d) => <ProductBrowser products={d} showCategoryFilter />}
      </AsyncContent>
    </div>
  )
}
