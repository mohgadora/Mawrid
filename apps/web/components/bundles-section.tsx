'use client'

import Image from 'next/image'
import { ShoppingCart, Check, Package, Tag } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useRole } from '@/lib/role'
import { PRODUCTS, retailPriceUsd } from '@/lib/data'

// A bundle: fixed set of product IDs + a discount percentage
const BUNDLES = [
  {
    id: 'bundle-kitchen',
    nameAr: 'حزمة المطبخ الأساسية',
    nameEn: 'Essential Kitchen Bundle',
    descriptionAr: 'أرز + زيت + سكر — كل ما تحتاجه يومياً بسعر خاص',
    descriptionEn: 'Rice + Oil + Sugar — everything you need daily at a special price',
    productIds: ['rice-basmati', 'sunflower-oil', 'white-sugar'],
    discountPct: 12,
  },
  {
    id: 'bundle-snacks',
    nameAr: 'حزمة المشروبات والوجبات',
    nameEn: 'Snacks & Beverages Bundle',
    descriptionAr: 'مشروبات غازية + رقائق — الأكثر طلباً في البقالات',
    descriptionEn: 'Soft drinks + Chips — top sellers in grocery stores',
    productIds: ['soft-drinks', 'chips-snacks'],
    discountPct: 10,
  },
  {
    id: 'bundle-dairy',
    nameAr: 'حزمة الألبان والمعلبات',
    nameEn: 'Dairy & Canned Bundle',
    descriptionAr: 'حليب طويل الأجل + طماطم معلبة — جودة وتنوّع',
    descriptionEn: 'Long-life milk + Canned tomatoes — quality and variety',
    productIds: ['uht-milk', 'canned-tomatoes'],
    discountPct: 8,
  },
]

function BundleCard({ bundle }: { bundle: typeof BUNDLES[number] }) {
  const { lang, formatPrice } = useI18n()
  const { addItem } = useCart()
  const { isMerchant } = useRole()
  const [added, setAdded] = useState(false)

  const products = bundle.productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) as typeof PRODUCTS

  const originalTotal = products.reduce((sum, p) => {
    const price = isMerchant ? p.basePrice : retailPriceUsd(p)
    return sum + price
  }, 0)

  const bundleTotal = originalTotal * (1 - bundle.discountPct / 100)
  const savings = originalTotal - bundleTotal

  const name = lang === 'ar' ? bundle.nameAr : bundle.nameEn
  const description = lang === 'ar' ? bundle.descriptionAr : bundle.descriptionEn

  function handleAddBundle() {
    products.forEach((p) => addItem(p.id, isMerchant ? p.moq : 1))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary/5 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Package className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-bold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">
          -{bundle.discountPct}%
        </span>
      </div>

      {/* Products row */}
      <div className="flex items-center gap-2 px-4 py-3">
        {products.map((p, i) => {
          const pName = lang === 'ar' ? p.nameAr : p.nameEn
          return (
            <div key={p.id} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-sm font-bold text-muted-foreground">+</span>
              )}
              <div className="flex flex-col items-center gap-1">
                <div className="relative size-14 overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={p.image || '/placeholder.svg'}
                    alt={pName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <span className="max-w-14 text-center text-[10px] leading-tight text-muted-foreground line-clamp-2">
                  {pName.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </div>
          )
        })}
        <div className="ms-auto flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(originalTotal)}
          </span>
          <span className="text-xl font-black text-primary">
            {formatPrice(bundleTotal)}
          </span>
        </div>
      </div>

      {/* Savings + CTA */}
      <div className="mt-auto flex items-center gap-3 border-t border-border px-4 py-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success">
          <Tag className="size-3.5" />
          {lang === 'ar'
            ? `وفّر ${formatPrice(savings)}`
            : `Save ${formatPrice(savings)}`}
        </div>
        <button
          onClick={handleAddBundle}
          className="ms-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {added ? (
            <>
              <Check className="size-4" />
              {lang === 'ar' ? 'تمت الإضافة' : 'Added!'}
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              {lang === 'ar' ? 'أضف الحزمة' : 'Add Bundle'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export function BundlesSection() {
  const { lang } = useI18n()

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-chart-3 text-white">
          <Package className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-foreground">
            {lang === 'ar' ? 'حزم المنتجات' : 'Product Bundles'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? 'اشتر معاً وأوفر أكثر'
              : 'Buy together and save more'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUNDLES.map((bundle) => (
          <BundleCard key={bundle.id} bundle={bundle} />
        ))}
      </div>
    </section>
  )
}
