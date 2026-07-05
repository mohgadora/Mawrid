'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, X } from 'lucide-react'
import { useRecentlyViewed } from '@/lib/recently-viewed'
import { useI18n } from '@/lib/i18n'
import { useProducts } from '@/lib/use-products'

export function RecentlyViewedStrip() {
  const { ids, clear } = useRecentlyViewed()
  const { lang } = useI18n()
  const { products: allProducts } = useProducts()

  const products = ids
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as typeof allProducts

  if (products.length === 0) return null

  return (
    <section className="border-t border-border bg-card/60 py-3">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Clock className="size-3.5" />
            {lang === 'ar' ? 'شاهدتها مؤخراً' : 'Recently viewed'}
          </h2>
          <button
            onClick={clear}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label={lang === 'ar' ? 'مسح المشاهدات الأخيرة' : 'Clear recently viewed'}
          >
            <X className="size-3" />
            {lang === 'ar' ? 'مسح' : 'Clear'}
          </button>
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {products.map((product) => {
            const name = lang === 'ar' ? product.nameAr : product.nameEn
            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group flex w-24 shrink-0 flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                title={name}
              >
                <div className="relative aspect-square w-24 overflow-hidden rounded-xl border border-border bg-muted transition-transform group-hover:scale-[1.03]">
                  <Image
                    src={product.image || '/placeholder.svg'}
                    alt={name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                  {name}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
