'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { BadgeCheck, Eye, Star } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { retailPriceUsd, type Product } from '@/lib/data'
import { MarketPriceBadge } from '@/components/market-price-badge'
import { WishlistButton } from '@/components/wishlist-button'
import { QuickViewModal } from '@/components/quick-view-modal'
import { FlashSaleBadge } from '@/components/flash-sale-badge'

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const { t, lang, formatPrice } = useI18n()
  const { isMerchant } = useRole()
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const name = lang === 'ar' ? product.nameAr : product.nameEn
  const supplier = lang === 'ar' ? product.supplierAr : product.supplierEn

  const price = isMerchant ? product.basePrice : retailPriceUsd(product)
  const discount =
    isMerchant && product.oldPrice
      ? Math.round((1 - product.basePrice / product.oldPrice) * 100)
      : 0

  return (
    <>
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          onClose={() => setQuickViewOpen(false)}
        />
      )}

      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Link
            href={`/product/${product.id}`}
            className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Image
              src={product.image || '/placeholder.svg'}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {discount > 0 && (
            <span className="pointer-events-none absolute start-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
              -{discount}%
            </span>
          )}

          <WishlistButton
            productId={product.id}
            size="sm"
            className="absolute end-2 top-2"
          />

          {product.verified && (
            <span className="pointer-events-none absolute end-2 top-2 flex items-center gap-0.5 rounded-md bg-success px-1.5 py-0.5 text-[11px] font-bold text-success-foreground">
              <BadgeCheck className="size-3" />
              {t('verified')}
            </span>
          )}

          {/* Quick View hover button */}
          <button
            onClick={() => setQuickViewOpen(true)}
            aria-label={lang === 'ar' ? 'معاينة سريعة' : 'Quick view'}
            className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-card/90 py-1.5 text-xs font-semibold text-foreground opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Eye className="size-3.5" />
            {lang === 'ar' ? 'معاينة سريعة' : 'Quick view'}
          </button>
        </div>

        {/* Card body */}
        <Link
          href={`/product/${product.id}`}
          className="flex flex-1 flex-col gap-1.5 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {/* Flash sale badge if on sale */}
          {product.oldPrice && <FlashSaleBadge size="sm" />}

          <MarketPriceBadge product={product} price={price} size="sm" className="w-fit" />

          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground">
            {name}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">{supplier}</p>

          <div className="mt-auto flex items-end gap-1.5 pt-1">
            <span className="text-lg font-black text-primary">{formatPrice(price)}</span>
            {isMerchant && product.oldPrice && (
              <span className="pb-0.5 text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {isMerchant ? t('perCarton') : `${t('retailPrice')} · ${t('perCarton')}`}
          </span>

          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="size-3 fill-chart-3 text-chart-3" />
              {product.rating}
            </span>
            <span>
              {t('moq')}: {product.moq} {t('carton')}
            </span>
          </div>
        </Link>
      </div>
    </>
  )
}
