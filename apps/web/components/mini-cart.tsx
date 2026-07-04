'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import {
  X,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Truck,
  PackageCheck,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useRole } from '@/lib/role'
import { useMiniCart } from '@/lib/mini-cart'
import { useSaveForLater } from '@/lib/save-for-later'
import { getProduct, priceForRole } from '@/lib/data'
import { SHIPPING } from '@/lib/config'
import { cn } from '@/lib/utils'

export function MiniCart() {
  const { t, lang, formatPrice } = useI18n()
  const { items, updateQty, removeItem, addItem, subtotalUsd } = useCart()
  const { role, isMerchant } = useRole()
  const { open, openCart, closeCart } = useMiniCart()
  const { saveItem, removeFromSaved, isSaved } = useSaveForLater()

  // Auto-open when an item is added to cart
  useEffect(() => {
    const handler = () => openCart()
    window.addEventListener('mawrid:open-mini-cart', handler)
    return () => window.removeEventListener('mawrid:open-mini-cart', handler)
  }, [openCart])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeCart])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const lines = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: getProduct(i.productId) }))
        .filter((l): l is { item: typeof l.item; product: NonNullable<typeof l.product> } =>
          Boolean(l.product),
        ),
    [items],
  )

  const shippingUsd =
    subtotalUsd > 0 && subtotalUsd < SHIPPING.freeOverUsd ? SHIPPING.flatUsd : 0
  const totalUsd = subtotalUsd + shippingUsd
  const remaining = Math.max(0, SHIPPING.freeOverUsd - subtotalUsd)
  const shipPct = Math.min(100, (subtotalUsd / SHIPPING.freeOverUsd) * 100)
  const freeShipping = remaining === 0

  const isRtl = lang === 'ar'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Drawer */}
      <aside
        aria-label={lang === 'ar' ? 'سلة التسوق' : 'Shopping cart'}
        aria-modal="true"
        role="dialog"
        className={cn(
          'fixed top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out',
          isRtl ? 'left-0' : 'right-0',
          open
            ? 'translate-x-0'
            : isRtl
            ? '-translate-x-full'
            : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              {lang === 'ar' ? 'سلة التسوق' : 'Your Cart'}
            </h2>
            {lines.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                {lines.length}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label={lang === 'ar' ? 'إغلاق' : 'Close cart'}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Free shipping bar */}
        <div className="border-b border-border px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            {freeShipping ? (
              <span className="flex items-center gap-1.5 font-semibold text-success">
                <PackageCheck className="size-3.5" />
                {lang === 'ar' ? 'شحن مجاني مفعّل!' : 'Free shipping unlocked!'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Truck className="size-3.5 text-primary" />
                {lang === 'ar'
                  ? `أضف ${formatPrice(remaining)} للشحن المجاني`
                  : `Add ${formatPrice(remaining)} for free shipping`}
              </span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${shipPct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(shipPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-accent">
                <ShoppingCart className="size-7 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}
              </p>
              <button
                onClick={closeCart}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t('continueShopping')}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map(({ item, product }) => {
                const name = lang === 'ar' ? product.nameAr : product.nameEn
                const unit = priceForRole(product, item.qty, role)
                const minQty = isMerchant ? product.moq : 1
                const alreadySaved = isSaved(product.id)
                return (
                  <li
                    key={item.productId}
                    className="flex gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    <Link
                      href={`/product/${product.id}`}
                      onClick={closeCart}
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

                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <Link
                        href={`/product/${product.id}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-xs font-medium text-foreground hover:text-primary leading-snug"
                      >
                        {name}
                      </Link>
                      <p className="text-xs font-bold text-primary">
                        {formatPrice(unit * item.qty)}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        {/* Qty stepper */}
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                            disabled={item.qty <= minQty}
                            aria-label={t('remove')}
                            className="grid size-6 place-items-center transition-colors hover:bg-accent disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                            aria-label={t('addToCart')}
                            className="grid size-6 place-items-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (!alreadySaved) {
                                saveItem(product.id, item.qty)
                                removeItem(product.id)
                              }
                            }}
                            disabled={alreadySaved}
                            title={lang === 'ar' ? 'احفظ لاحقاً' : 'Save for later'}
                            aria-label={lang === 'ar' ? 'احفظ لاحقاً' : 'Save for later'}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {alreadySaved ? (
                              <BookmarkCheck className="size-3.5 text-primary" />
                            ) : (
                              <Bookmark className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            aria-label={t('remove')}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer: totals + actions */}
        {lines.length > 0 && (
          <div className="border-t border-border bg-card px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {lang === 'ar' ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-lg font-black text-primary">{formatPrice(totalUsd)}</span>
            </div>

            <Link
              href="/cart"
              onClick={closeCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {lang === 'ar' ? 'إتمام الطلب' : 'Proceed to checkout'}
              <ArrowRight className={cn('size-4', isRtl && 'rotate-180')} />
            </Link>

            <Link
              href="/cart"
              onClick={closeCart}
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {lang === 'ar' ? 'عرض السلة كاملة' : 'View full cart'}
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
