'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Star, Check, X, GitCompare, ShoppingCart } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useRole } from '@/lib/role'
import { PRODUCTS, priceForQty, retailPriceUsd, type Product } from '@/lib/data'
import { MarketPriceBadge } from '@/components/market-price-badge'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="w-36 shrink-0 py-3 pe-4 align-top text-xs font-semibold text-muted-foreground sm:w-44">
        {label}
      </td>
      {children}
    </tr>
  )
}

export function CompareView({ ids }: { ids: string[] }) {
  const { lang, t, formatPrice } = useI18n()
  const { addItem } = useCart()
  const { isMerchant } = useRole()

  const products = ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) as Product[]

  const prices = products.map((p) =>
    isMerchant ? priceForQty(p, p.moq) : retailPriceUsd(p),
  )
  const minPrice = Math.min(...prices)

  if (products.length < 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <GitCompare className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">
          {lang === 'ar' ? 'اختر منتجين على الأقل للمقارنة' : 'Select at least 2 products to compare'}
        </h1>
        <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t('backToHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-foreground text-balance">
          {lang === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'ar'
            ? `تقارن ${products.length} منتجات`
            : `Comparing ${products.length} products`}
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="w-36 sm:w-44" />
              {products.map((p) => (
                <th key={p.id} className="pb-4 align-top">
                  <div className="flex flex-col items-center gap-2 px-2">
                    <div className="relative aspect-square w-full max-w-[120px] overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        src={p.image || '/placeholder.svg'}
                        alt={lang === 'ar' ? p.nameAr : p.nameEn}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                    <Link
                      href={`/product/${p.id}`}
                      className="text-center text-sm font-bold leading-tight text-foreground hover:text-primary line-clamp-2"
                    >
                      {lang === 'ar' ? p.nameAr : p.nameEn}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price */}
            <Row label={lang === 'ar' ? 'السعر' : 'Price'}>
              {products.map((p, i) => {
                const price = prices[i]
                const isCheapest = price === minPrice
                return (
                  <td key={p.id} className="py-3 px-2 text-center align-top">
                    <span className={`text-lg font-black ${isCheapest ? 'text-success' : 'text-foreground'}`}>
                      {formatPrice(price)}
                    </span>
                    {isCheapest && products.length > 1 && (
                      <p className="text-[11px] font-semibold text-success">
                        {lang === 'ar' ? 'الأرخص' : 'Best price'}
                      </p>
                    )}
                  </td>
                )
              })}
            </Row>

            {/* Market savings */}
            <Row label={lang === 'ar' ? 'مقارنة بالسوق' : 'vs. Market'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 align-top">
                  <div className="flex justify-center">
                    <MarketPriceBadge product={p} price={isMerchant ? priceForQty(p, p.moq) : retailPriceUsd(p)} size="sm" />
                  </div>
                </td>
              ))}
            </Row>

            {/* Rating */}
            <Row label={lang === 'ar' ? 'التقييم' : 'Rating'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  <span className="flex items-center justify-center gap-1 text-sm font-bold">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {p.rating}
                  </span>
                </td>
              ))}
            </Row>

            {/* Supplier */}
            <Row label={lang === 'ar' ? 'المورد' : 'Supplier'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  <p className="text-sm text-foreground">
                    {lang === 'ar' ? p.supplierAr : p.supplierEn}
                  </p>
                </td>
              ))}
            </Row>

            {/* Verified */}
            <Row label={lang === 'ar' ? 'موثوق' : 'Verified'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  {p.verified ? (
                    <span className="flex items-center justify-center gap-1 text-xs font-semibold text-success">
                      <BadgeCheck className="size-4" />
                      {lang === 'ar' ? 'موثق' : 'Verified'}
                    </span>
                  ) : (
                    <X className="mx-auto size-4 text-muted-foreground" />
                  )}
                </td>
              ))}
            </Row>

            {/* MOQ */}
            <Row label={lang === 'ar' ? 'أقل كمية' : 'Min. Order'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  <p className="text-sm font-semibold text-foreground">
                    {p.moq} {lang === 'ar' ? 'كرتون' : 'cartons'}
                  </p>
                </td>
              ))}
            </Row>

            {/* Units per carton */}
            <Row label={lang === 'ar' ? 'وحدة/كرتون' : 'Units/Carton'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  <p className="text-sm font-semibold text-foreground">{p.unitsPerCarton}</p>
                </td>
              ))}
            </Row>

            {/* Sold */}
            <Row label={lang === 'ar' ? 'المبيعات' : 'Sold'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  <p className="text-sm font-semibold text-foreground">
                    {p.sold.toLocaleString()}
                  </p>
                </td>
              ))}
            </Row>

            {/* Tiered pricing */}
            <Row label={lang === 'ar' ? 'أسعار متدرجة' : 'Tiered Pricing'}>
              {products.map((p) => (
                <td key={p.id} className="py-3 px-2 text-center align-top">
                  {p.tiers.length > 1 ? (
                    <Check className="mx-auto size-4 text-success" />
                  ) : (
                    <X className="mx-auto size-4 text-muted-foreground" />
                  )}
                </td>
              ))}
            </Row>

            {/* Actions */}
            <Row label="">
              {products.map((p) => (
                <td key={p.id} className="py-4 px-2 align-top">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => addItem(p.id, p.moq)}
                      className="flex w-full max-w-[140px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ShoppingCart className="size-4" />
                      {t('addToCart')}
                    </button>
                    <Link
                      href={`/product/${p.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {lang === 'ar' ? 'عرض التفاصيل' : 'View details'}
                    </Link>
                  </div>
                </td>
              ))}
            </Row>
          </tbody>
        </table>
      </div>
    </div>
  )
}
