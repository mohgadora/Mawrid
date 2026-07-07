'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Check,
  TrendingDown,
  PackageCheck,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  TicketPercent,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart, toCartSnapshot, priceForRoleSnapshot, marketSavingsSnapshot, type CartProductSnapshot } from '@/lib/cart'
import { useRole } from '@/lib/role'
import { SHIPPING } from '@/lib/config'
import { useSaveForLater } from '@/lib/save-for-later'
import { useCoupon } from '@/lib/coupon'
import { validateCouponApi } from '@/lib/api-client'

export function CartView() {
  const { t, lang, formatPrice } = useI18n()
  const { items, updateQty, removeItem, addItem, clear } = useCart()
  const { role, isMerchant } = useRole()
  const router = useRouter()
  const { saved, saveItem, removeFromSaved, isSaved } = useSaveForLater()
  const [placed, setPlaced] = useState(false)
  const [savedOpen, setSavedOpen] = useState(true)

  const lines = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: i.snapshot ?? null }))
        .filter((l): l is { item: typeof l.item; product: CartProductSnapshot } =>
          l.product !== null,
        ),
    [items],
  )

  const savedLines = useMemo(
    () =>
      saved
        .map((i) => ({ item: i, product: i.snapshot ?? null }))
        .filter((l): l is { item: typeof l.item; product: CartProductSnapshot } =>
          l.product !== null,
        ),
    [saved],
  )

  const { subtotalUsd, savingsUsd } = useMemo(() => {
    let subtotal = 0
    let savings = 0
    for (const { item, product } of lines) {
      const unit = priceForRoleSnapshot(product, item.qty, role)
      subtotal += unit * item.qty
      savings += marketSavingsSnapshot(product, unit, item.qty)
    }
    return { subtotalUsd: subtotal, savingsUsd: savings }
  }, [lines, role])

  const shippingUsd =
    subtotalUsd > 0 && subtotalUsd < SHIPPING.freeOverUsd ? SHIPPING.flatUsd : 0

  // Coupon
  const { coupon, applyCoupon, clearCoupon } = useCoupon()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const discountUsd = coupon
    ? coupon.freeShipping
      ? shippingUsd
      : Math.min(coupon.discountUsd, subtotalUsd)
    : 0
  const totalUsd = Math.max(0, subtotalUsd + shippingUsd - discountUsd)

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code || couponLoading) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await validateCouponApi({ code, subtotal: subtotalUsd, shipping: shippingUsd })
      applyCoupon({ code: res.code, discountUsd: res.discountUsd, freeShipping: res.freeShipping })
      setCouponInput('')
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : t('errorTitle'))
    } finally {
      setCouponLoading(false)
    }
  }

  // Keep the applied coupon's discount in sync as the cart total changes.
  useEffect(() => {
    if (!coupon || subtotalUsd <= 0) return
    let cancelled = false
    validateCouponApi({ code: coupon.code, subtotal: subtotalUsd, shipping: shippingUsd })
      .then((res) => {
        if (cancelled) return
        if (res.discountUsd !== coupon.discountUsd || res.freeShipping !== coupon.freeShipping) {
          applyCoupon({ code: res.code, discountUsd: res.discountUsd, freeShipping: res.freeShipping })
        }
      })
      .catch(() => {
        if (!cancelled) clearCoupon()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotalUsd, shippingUsd])

  if (placed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-8" />
        </span>
        <h1 className="text-2xl font-bold text-foreground">
          {lang === 'ar' ? 'تم استلام طلبك!' : 'Order placed!'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'سيتواصل معك المورد لتأكيد التفاصيل والتوصيل.'
            : 'The supplier will contact you to confirm details and delivery.'}
        </p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  if (lines.length === 0 && savedLines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-accent text-accent-foreground">
          <ShoppingCart className="size-9" />
        </span>
        <h1 className="text-xl font-bold text-foreground">{t('emptyCart')}</h1>
        <p className="text-sm text-muted-foreground text-pretty">{t('emptyCartDesc')}</p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
        <ShoppingCart className="size-6 text-primary" />
        {t('cart')}
        {lines.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({lines.length} {t('items')})
          </span>
        )}
      </h1>

      {/* Free shipping progress bar */}
      {lines.length > 0 && (() => {
        const remaining = Math.max(0, SHIPPING.freeOverUsd - subtotalUsd)
        const pct = Math.min(100, (subtotalUsd / SHIPPING.freeOverUsd) * 100)
        const reached = remaining === 0
        return (
          <div className="mb-5 rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              {reached ? (
                <span className="flex items-center gap-1.5 font-semibold text-success">
                  <PackageCheck className="size-4" />
                  {lang === 'ar' ? 'يسعدنا توصيل طلبك مجاناً!' : "You've unlocked free shipping!"}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="size-4 text-primary" />
                  {lang === 'ar'
                    ? `أضف ${formatPrice(remaining)} للحصول على شحن مجاني`
                    : `Add ${formatPrice(remaining)} for free shipping`}
                </span>
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {formatPrice(subtotalUsd)} / {formatPrice(SHIPPING.freeOverUsd)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )
      })()}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column: cart items + saved for later */}
        <div className="flex flex-col gap-6">
          {/* Active cart items */}
          {lines.length > 0 && (
            <div className="flex flex-col gap-3">
              {lines.map(({ item, product }) => {
                const name = lang === 'ar' ? product.nameAr : product.nameEn
                const supplier = lang === 'ar' ? product.supplierAr : product.supplierEn
                const unit = priceForRoleSnapshot(product, item.qty, role)
                const minQty = isMerchant ? product.moq : 1
                const alreadySaved = isSaved(product.id)
                return (
                  <div
                    key={item.productId}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <Link
                      href={`/product/${product.id}`}
                      className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
                    >
                      <Image
                        src={product.image || '/placeholder.svg'}
                        alt={name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                      >
                        {name}
                      </Link>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{supplier}</p>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatPrice(unit)}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          / {t('carton')}
                        </span>
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-lg border border-border">
                          <button
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                            className="grid size-8 place-items-center transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            disabled={item.qty <= minQty}
                            aria-label={t('remove')}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                            className="grid size-8 place-items-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={t('addToCart')}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {formatPrice(unit * item.qty)}
                          </span>
                          {/* Save for Later */}
                          <button
                            onClick={() => {
                              if (!alreadySaved) {
                                saveItem(product.id, item.qty, product)
                                removeItem(product.id)
                              }
                            }}
                            disabled={alreadySaved}
                            title={lang === 'ar' ? 'احفظ لاحقاً' : 'Save for later'}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={lang === 'ar' ? 'احفظ لاحقاً' : 'Save for later'}
                          >
                            {alreadySaved ? (
                              <BookmarkCheck className="size-4 text-primary" />
                            ) : (
                              <Bookmark className="size-4" />
                            )}
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={t('remove')}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty cart with saved items */}
          {lines.length === 0 && savedLines.length > 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-10 text-center">
              <ShoppingCart className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'السلة فارغة — استعد منتجاتك المحفوظة أدناه' : 'Cart is empty — move saved items back to cart below'}
              </p>
            </div>
          )}

          {/* Saved for Later section */}
          {savedLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setSavedOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-foreground hover:bg-accent/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="size-4 text-primary" />
                  {lang === 'ar' ? 'محفوظ لاحقاً' : 'Saved for later'}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {savedLines.length}
                  </span>
                </span>
                {savedOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {savedOpen && (
                <div className="flex flex-col divide-y divide-border border-t border-border">
                  {savedLines.map(({ item, product }) => {
                    const name = lang === 'ar' ? product.nameAr : product.nameEn
                    const supplier = lang === 'ar' ? product.supplierAr : product.supplierEn
                const unit = priceForRoleSnapshot(product, item.qty, role)
                    return (
                      <div key={item.productId} className="flex gap-3 p-3">
                        <Link
                          href={`/product/${product.id}`}
                          className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                        >
                          <Image
                            src={product.image || '/placeholder.svg'}
                            alt={name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </Link>

                        <div className="flex flex-1 flex-col gap-1">
                          <Link
                            href={`/product/${product.id}`}
                            className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                          >
                            {name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{supplier}</p>
                          <p className="text-sm font-bold text-primary">
                            {formatPrice(unit)}
                            <span className="text-xs font-normal text-muted-foreground">
                              {' '}/ {t('carton')}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-2">
                          <button
                            onClick={() => removeFromSaved(product.id)}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={t('remove')}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              addItem(product, item.qty)
                              removeFromSaved(product.id)
                            }}
                            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {lang === 'ar' ? 'أضف للسلة' : 'Move to cart'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {lines.length > 0 && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-base font-bold text-foreground">{t('checkout')}</h2>

              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('subtotal')}</dt>
                  <dd className="font-semibold text-foreground">{formatPrice(subtotalUsd)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('shipping')}</dt>
                  <dd className="font-semibold text-foreground">
                    {shippingUsd === 0 ? (
                      <span className="text-success">{t('freeShipping')}</span>
                    ) : (
                      formatPrice(shippingUsd)
                    )}
                  </dd>
                </div>
                {discountUsd > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-success">
                      {t('discount')}
                      {coupon ? <span className="text-muted-foreground"> ({coupon.code})</span> : null}
                    </dt>
                    <dd className="font-semibold text-success">−{formatPrice(discountUsd)}</dd>
                  </div>
                )}
                <div className="my-1 border-t border-border" />
                <div className="flex items-center justify-between">
                  <dt className="font-bold text-foreground">{t('total')}</dt>
                  <dd className="text-xl font-black text-primary">{formatPrice(totalUsd)}</dd>
                </div>
              </dl>

              {/* Coupon */}
              <div className="mt-3 border-t border-border pt-3">
                {coupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-success/10 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
                      <TicketPercent className="size-4" />
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" />
                      {t('couponRemove')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="coupon-code"
                      className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <TicketPercent className="size-3.5" />
                      {t('couponTitle')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon-code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyCoupon()
                          }
                        }}
                        placeholder={t('couponPlaceholder')}
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {couponLoading ? '…' : t('couponApply')}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-xs text-destructive">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {savingsUsd > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                  <TrendingDown className="size-4 shrink-0" />
                  {t('save')} {formatPrice(savingsUsd)} {t('savedVsMarket')}
                </p>
              )}

              <button
                onClick={() => router.push('/checkout')}
                className="mt-4 w-full rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t('checkout')}
              </button>

              <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-success" />
                  {t('orderProtection')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="size-4 text-primary" />
                  {t('fastDelivery')}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="mt-3 flex justify-center rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {t('continueShopping')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
