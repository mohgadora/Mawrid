'use client'

import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Star, MapPin, CalendarDays, Package, Store, ChevronLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { getSupplierWithProducts, type SupplierResult } from '@/lib/api-client'
import { ProductBrowser } from '@/components/product-browser'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { ProductGridSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export function SupplierView({ id }: { id: string }) {
  const { t, lang, dir } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<SupplierResult>(
    ['supplier', id],
    () => getSupplierWithProducts(id),
  )

  const yearsActive = data?.supplier ? new Date().getFullYear() - data.supplier.since : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t('backToHome')}
        </Link>
        <ChevronLeft className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        <span className="text-foreground">{t('supplier')}</span>
      </nav>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <ProductGridSkeleton count={8} />
          </div>
        }
        isEmpty={(d) => d.supplier === null}
        empty={
          <EmptyState
            icon={Store}
            title={t('notFound')}
            description={t('errorDesc')}
            actionLabel={t('backToHome')}
            actionHref="/"
          />
        }
      >
        {(d) => {
          const s = d.supplier
          if (!s) return null
          const name = lang === 'ar' ? s.nameAr : s.nameEn
          const city = lang === 'ar' ? s.cityAr : s.cityEn
          const description = lang === 'ar' ? s.descriptionAr : s.descriptionEn
          return (
            <>
              <header className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-accent">
                    <Image
                      src={s.logo || '/placeholder-logo.png'}
                      alt={name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-black text-foreground text-balance">{name}</h1>
                      {s.verified && (
                        <span className="flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                          <BadgeCheck className="size-3.5" />
                          {t('verified')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
                      {description}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                  <Stat icon={Star} label={t('rating')} value={s.rating.toString()} accent />
                  <Stat
                    icon={CalendarDays}
                    label={t('yearsActive')}
                    value={`${yearsActive} ${t('years')}`}
                  />
                  <Stat icon={MapPin} label={t('location')} value={city} />
                  <Stat
                    icon={Package}
                    label={t('productsCount')}
                    value={d.products.length.toString()}
                  />
                </dl>
              </header>

              <h2 className="mb-4 text-lg font-bold text-foreground">{t('supplierProducts')}</h2>
              {d.products.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={t('noResults')}
                  description={t('noResultsDesc')}
                />
              ) : (
                <ProductBrowser products={d.products} />
              )}
            </>
          )
        }}
      </AsyncContent>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Star
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 bg-card p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className={`size-4 ${accent ? 'fill-chart-3 text-chart-3' : 'text-primary'}`} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}
