'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  Truck,
  ShieldCheck,
  Wallet,
  ChevronLeft,
  Check,
  Lock,
  TrendingUp,
  Share2,
  Zap,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart, toCartSnapshot } from '@/lib/cart'
import { useRole } from '@/lib/role'
import {
  activeTier,
  nextTier,
  priceForQty,
  retailPriceUsd,
  type Product,
} from '@/lib/data'
import { useRecentlyViewed } from '@/lib/recently-viewed'
import { WishlistButton } from '@/components/wishlist-button'
import { CompareButton } from '@/components/compare-button'
import { ProductCard } from '@/components/product-card'
import { MarketPriceBadge } from '@/components/market-price-badge'
import { MarketIndicator } from '@/components/market-indicator'
import { ProductReviews } from '@/components/product-reviews'
import { ShippingDetails } from '@/components/shipping-details'
import { FlashSaleBadge } from '@/components/flash-sale-badge'
import { StockCounter } from '@/components/stock-counter'
import { NotifyBackInStock } from '@/components/notify-back-in-stock'
import { ProductQA } from '@/components/product-qa'

export function ProductDetail({
  product,
  related,
}: {
  product: Product
  related: Product[]
}) {
  const { t, lang, formatPrice, dir } = useI18n()
  const { addItem } = useCart()
  const { isMerchant } = useRole()
  const { push: pushRecent } = useRecentlyViewed()
  const minQty = isMerchant ? product.moq : 1
  const [qty, setQty] = useState(minQty)
  const [added, setAdded] = useState(false)
  const [shared, setShared] = useState(false)
  // Simulated stock — in a real app this would come from inventory API
  const stock = Math.floor(((product.sold % 7) + 3))

  // Track this product as recently viewed on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { pushRecent(product.id) })

  const name = lang === 'ar' ? product.nameAr : product.nameEn
  const supplier = lang === 'ar' ? product.supplierAr : product.supplierEn
  const description = lang === 'ar' ? product.descriptionAr : product.descriptionEn

  const unitPrice = useMemo(
    () => (isMerchant ? priceForQty(product, qty) : retailPriceUsd(product)),
    [product, qty, isMerchant],
  )
  const lineTotal = unitPrice * qty
  const discount =
    isMerchant && product.oldPrice
      ? Math.round((1 - product.basePrice / product.oldPrice) * 100)
      : 0
  const upcoming = useMemo(
    () => (isMerchant ? nextTier(product, qty) : null),
    [product, qty, isMerchant],
  )
  const upcomingSavingsPct = upcoming
    ? Math.round((1 - upcoming.pricePerCarton / activeTier(product, qty).pricePerCarton) * 100)
    : 0

  const Chevron = ChevronLeft

  function changeQty(delta: number) {
    setQty((q) => Math.max(minQty, q + delta))
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  function handleAdd() {
    addItem(toCartSnapshot(product), qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow() {
    addItem(toCartSnapshot(product), qty)
    // Navigate to checkout immediately
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout'
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pb-24 lg:pb-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          {t('backToHome')}
        </Link>
        <Chevron className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        <Link href={`/category/${product.categorySlug}`} className="hover:text-primary">
          {t('categories')}
        </Link>
        <Chevron className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        <span className="line-clamp-1 text-foreground">{name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-square bg-muted">
            <Image
              src={product.image || '/placeholder.svg'}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            {discount > 0 && (
              <span className="absolute start-3 top-3 rounded-md bg-primary px-2 py-1 text-sm font-bold text-primary-foreground">
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            {/* Flash sale badge */}
            {product.oldPrice && (
              <div className="mb-3">
                <FlashSaleBadge />
              </div>
            )}
            <MarketPriceBadge product={product} price={unitPrice} className="mb-2" />
            <div className="flex items-start gap-2">
              <h1 className="flex-1 text-xl font-bold leading-snug text-foreground text-balance sm:text-2xl">
                {name}
              </h1>
              <WishlistButton productId={product.id} size="md" className="mt-0.5 shrink-0" />
              <button
                onClick={handleShare}
                aria-label={lang === 'ar' ? 'مشاركة المنتج' : 'Share product'}
                className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {shared ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Share2 className="size-3.5" />
                )}
                <span className="hidden sm:inline">
                  {shared
                    ? lang === 'ar' ? 'تم النسخ' : 'Copied!'
                    : lang === 'ar' ? 'مشاركة' : 'Share'}
                </span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-chart-3">
                <Star className="size-4 fill-chart-3 text-chart-3" />
                {product.rating}
              </span>
              <span className="opacity-40">|</span>
              <span>
                {product.sold.toLocaleString(lang === 'ar' ? 'ar' : 'en-US')} {t('sold')}
              </span>
            </div>
          </div>


          {/* Price box */}
          <div className="rounded-xl bg-accent/60 p-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-primary">
                {formatPrice(unitPrice)}
              </span>
              {isMerchant && product.oldPrice && (
                <span className="pb-1 text-sm text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="pb-1 text-sm text-muted-foreground">/ {t('carton')}</span>
            </div>
            {!isMerchant && (
              <span className="mt-1 inline-block text-xs font-medium text-muted-foreground">
                {t('retailPrice')}
              </span>
            )}

            {/* Tiered pricing — merchants only */}
            {isMerchant ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-foreground">
                  {t('tieredPricing')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {product.tiers.map((tier) => {
                    const active = activeTier(product, qty).minQty === tier.minQty
                    return (
                      <div
                        key={tier.minQty}
                        className={`rounded-lg border p-2 text-center transition-colors ${
                          active
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-card'
                        }`}
                      >
                        <p className="text-[11px] text-muted-foreground">
                          {tier.minQty}+ {t('carton')}
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {formatPrice(tier.pricePerCarton)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {upcoming && upcomingSavingsPct > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
                    <TrendingUp className="size-3.5 shrink-0" />
                    {t('addMoreForTier')} {upcoming.minQty - qty} {t('extraCartonsToSave')}{' '}
                    {upcomingSavingsPct}%
                  </p>
                )}
              </div>
            ) : (
              <Link
                href="/"
                className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Lock className="size-4 shrink-0" />
                {t('registerAsMerchant')}
              </Link>
            )}
          </div>

          {/* Stock counter / out-of-stock alert */}
          {stock > 0 ? (
            <StockCounter stock={stock} />
          ) : (
            <NotifyBackInStock productId={product.id} />
          )}

          {/* Compare */}
          <CompareButton productId={product.id} />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t('minOrderNote')}</p>
              <p className="font-bold text-foreground">
                {product.moq} {t('cartons')}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t('unitsPerCarton')}</p>
              <p className="font-bold text-foreground">{product.unitsPerCarton}</p>
            </div>
          </div>

          {/* Supplier */}
          <Link
            href={`/supplier/${product.supplierId}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Store className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t('supplier')}</p>
              <p className="flex items-center gap-1 font-semibold text-foreground">
                {supplier}
                {product.verified && <BadgeCheck className="size-4 text-success" />}
              </p>
            </div>
            {product.verified && (
              <span className="flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                <BadgeCheck className="size-3.5" />
                {t('verified')}
              </span>
            )}
          </Link>

          {/* Quantity + add to cart */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-card">
              <button
                onClick={() => changeQty(-1)}
                className="grid size-10 place-items-center text-foreground transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={qty <= minQty}
                aria-label={t('remove')}
              >
                <Minus className="size-4" />
              </button>
              <input
                value={qty}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  setQty(Number.isNaN(v) ? minQty : Math.max(minQty, v))
                }}
                className="w-14 bg-transparent text-center text-sm font-bold outline-none tabular-nums"
                inputMode="numeric"
                aria-label={t('quantity')}
              />
              <button
                onClick={() => changeQty(1)}
                className="grid size-10 place-items-center text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t('addToCart')}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{t('cartons')}</span>
            <span className="ms-auto text-sm text-muted-foreground">
              {t('total')}:{' '}
              <span className="text-lg font-black text-primary">{formatPrice(lineTotal)}</span>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {added ? (
                <>
                  <Check className="size-5" />
                  {t('added')}
                </>
              ) : (
                <>
                  <ShoppingCart className="size-5" />
                  {t('addToCart')}
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex items-center justify-center gap-2 rounded-xl bg-chart-3 px-5 py-3.5 text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-3 focus-visible:ring-offset-2"
              aria-label={lang === 'ar' ? 'اشتري الآن' : 'Buy Now'}
            >
              <Zap className="size-5 fill-white" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'اشتري الآن' : 'Buy Now'}
              </span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Truck, label: t('fastDelivery') },
              { icon: ShieldCheck, label: t('orderProtection') },
              { icon: Wallet, label: t('securePayment') },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-2 text-center"
              >
                <item.icon className="size-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market indicator */}
      <MarketIndicator product={product} ourPrice={unitPrice} className="mt-6" />

      {/* Shipping details */}
      <ShippingDetails basePrice={unitPrice} moq={product.moq} />

      {/* Description */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-lg font-bold text-foreground">{t('description')}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      {/* Q&A */}
      <ProductQA productId={product.id} />

      {/* Reviews */}
      <ProductReviews rating={product.rating} sold={product.sold} />

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">{t('recommended')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky mobile add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex flex-col">
          <span className="text-lg font-black text-primary">{formatPrice(lineTotal)}</span>
          <span className="text-[11px] text-muted-foreground">
            {qty} {t('cartons')}
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="ms-auto flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {added ? <Check className="size-5" /> : <ShoppingCart className="size-5" />}
          {added ? t('added') : t('addToCart')}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-chart-3 px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-3"
          aria-label={lang === 'ar' ? 'اشتري الآن' : 'Buy Now'}
        >
          <Zap className="size-4 fill-white" />
          {lang === 'ar' ? 'الآن' : 'Buy'}
        </button>
      </div>
    </div>
  )
}
