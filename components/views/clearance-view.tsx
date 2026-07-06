'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { Tag, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fetchClearances, type ClearanceGroup } from '@/lib/api-client'
import { ListSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'

export function ClearanceView() {
  const { lang, formatPrice } = useI18n()
  const { data, isLoading } = useSWR<ClearanceGroup[]>('clearance', fetchClearances)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
        <Tag className="size-6 text-primary" />
        {lang === 'ar' ? 'تصفية المخزون' : 'Clearance'}
      </h1>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : !data?.length ? (
        <EmptyState
          icon={Tag}
          title={lang === 'ar' ? 'لا توجد عروض تصفية حالياً' : 'No clearance sales right now'}
          description={lang === 'ar' ? 'تابعنا لعروض قادمة.' : 'Check back for upcoming sales.'}
          actionLabel={lang === 'ar' ? 'تصفّح المنتجات' : 'Browse products'}
          actionHref="/"
        />
      ) : (
        <div className="space-y-8">
          {data.map((sale) => (
            <section key={sale.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{lang === 'ar' ? sale.titleAr : (sale.titleEn ?? sale.titleAr)}</h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {lang === 'ar' ? 'ينتهي' : 'ends'} {new Date(sale.endsAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {sale.products.map((p) => (
                  <Link key={p.productId} href={`/product/${p.productId}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
                    <span className="relative block aspect-square bg-muted">
                      {p.image && <Image src={p.image} alt={p.name} fill sizes="200px" className="object-cover" />}
                      <span className="absolute end-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">-{Math.round(p.discountPercent)}%</span>
                    </span>
                    <div className="p-2.5">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-black text-primary">{formatPrice(p.salePrice)}</span>
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(p.basePrice)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
