'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  BadgeCheck,
  ExternalLink,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart, toCartSnapshot } from '@/lib/cart'
import { useRole } from '@/lib/role'
import { priceForQty, retailPriceUsd, activeTier, type Product } from '@/lib/data'
import { WishlistButton } from '@/components/wishlist-button'
import { FlashSaleBadge } from '@/components/flash-sale-badge'
import { StockCounter } from '@/components/stock-counter'

interface QuickViewModalProps {
  product: Product | null
  onClose: () => void
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { t, lang, formatPrice } = useI18n()
  const { addItem } = useCart()
  const { isMerchant } = useRole()
  const [added, setAdded] = useState(false)
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minQty = product ? (isMerchant ? product.moq : 1) : 1
  const [qty, setQty] = useState(minQty)

  const name = product ? (lang === 'ar' ? product.nameAr : product.nameEn) : ''
  const supplier = product ? (lang === 'ar' ? product.supplierAr : product.supplierEn) : ''

  const unitPrice = useMemo(
    () =>
      product
        ? isMerchant
          ? priceForQty(product, qty)
          : retailPriceUsd(product)
        : 0,
    [product, qty, isMerchant],
  )

  const discount =
    product && isMerchant && product.oldPrice
      ? Math.round((1 - product.basePrice / product.oldPrice) * 100)
      : 0

  const stock = product ? ((product as unknown as { stock?: number }).stock ?? 0) : 0

  function changeQty(delta: number) {
    setQty((q) => Math.max(minQty, q + delta))
  }

  useEffect(() => () => { if (addedTimerRef.current) clearTimeout(addedTimerRef.current) }, [])

  function handleAdd() {
    if (!product) return
    addItem(toCartSnapshot(product), qty)
    setAdded(true)
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current)
    addedTimerRef.current = setTimeout(() => setAdded(false), 1800)
  }

  if (!product) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="fixed inset-x-4 top-1/2 z-50 max-h-[90dvh] max-w-2xl -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-muted sm:rounded-s-2xl sm:rounded-tr-none">
            <Image
              src={product.image || '/placeholder.svg'}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            {discount > 0 && (
              <span className="absolute start-3 top-3 rounded-md bg-primary px-2 py-1 text-sm font-bold text-primary-foreground">
                -{discount}%
              </span>
            )}
            <WishlistButton
              productId={product.id}
              size="sm"
              className="absolute end-3 top-3"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3 p-5">
            {/* Flash sale badge */}
            {product.oldPrice && <FlashSaleBadge size="sm" />}

            <div>
              <h2 className="text-lg font-bold leading-snug text-foreground">{name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                {supplier}
                {product.verified && <BadgeCheck className="size-3.5 text-success" />}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span className="flex items-center gap-0.5 font-semibold text-chart-3">
                  <Star className="size-3.5 fill-chart-3 text-chart-3" />
                  {product.rating}
                </span>
                <span className="text-muted-foreground">
                  {product.sold.toLocaleString(lang === 'ar' ? 'ar' : 'en-US')} {t('sold')}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-primary">{formatPrice(unitPrice)}</span>
              {isMerchant && product.oldPrice && (
                <span className="pb-0.5 text-sm text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="pb-0.5 text-sm text-muted-foreground">/ {t('carton')}</span>
            </div>

            {/* Stock counter */}
            <StockCounter stock={stock} />

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-border bg-background">
                <button
                  onClick={() => changeQty(-1)}
                  disabled={qty <= minQty}
                  className="grid size-9 place-items-center text-foreground transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t('remove')}
                >
                  <Minus className="size-3.5" />
                </button>
                <input
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setQty(Number.isNaN(v) ? minQty : Math.max(minQty, v))
                  }}
                  className="w-12 bg-transparent text-center text-sm font-bold outline-none tabular-nums"
                  inputMode="numeric"
                  aria-label={t('quantity')}
                />
                <button
                  onClick={() => changeQty(1)}
                  className="grid size-9 place-items-center text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t('addToCart')}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{t('cartons')}</span>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {added ? (
                <>
                  <Check className="size-4" />
                  {t('added')}
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" />
                  {t('addToCart')}
                </>
              )}
            </button>

            {/* View full page */}
            <Link
              href={`/product/${product.id}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {lang === 'ar' ? 'عرض الصفحة الكاملة' : 'View full page'}
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
