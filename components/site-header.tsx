'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ShoppingCart,
  User,
  Globe,
  ChevronDown,
  Store,
  Truck,
  Menu,
  X,
  BadgeCheck,
  ShieldCheck,
  Users,
  Eye,
  Heart,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Tag,
  LayoutDashboard,
} from 'lucide-react'
import { useI18n, COUNTRIES, LANGS, LANG_LABEL, type Lang } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useMiniCart } from '@/lib/mini-cart'
import { useWishlist } from '@/lib/wishlist'
import { useRole } from '@/lib/role'
import type { Role } from '@/lib/config'
import { CATEGORIES, retailPriceUsd } from '@/lib/data'
import { CategoryIcon } from '@/components/category-icon'
import { HeaderSearch } from '@/components/header-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsPanel } from '@/components/notifications-panel'
import { useProducts } from '@/lib/use-products'

function Dropdown({
  label,
  icon,
  children,
  align = 'end',
}: {
  label: React.ReactNode
  icon?: React.ReactNode
  align?: 'start' | 'end'
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40"
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      {open && (
        <div
          className={`absolute ${align === 'end' ? 'end-0' : 'start-0'} top-full z-50 mt-1 min-w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

const ROLE_META: Record<string, { key: 'roleGuest' | 'roleConsumer' | 'roleMerchant' | 'roleAdmin'; icon: typeof Eye }> = {
  guest: { key: 'roleGuest', icon: Eye },
  consumer: { key: 'roleConsumer', icon: Users },
  merchant: { key: 'roleMerchant', icon: BadgeCheck },
  admin: { key: 'roleAdmin', icon: ShieldCheck },
}

function MegaMenu() {
  const { t, lang, formatPrice } = useI18n()
  const { role } = useRole()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { products: allProducts } = useProducts()
  const activeCategory = CATEGORIES.find((c) => c.slug === activeSlug) ?? CATEGORIES[0]
  const featuredProducts = allProducts.filter(
    (p) => p.categorySlug === (activeSlug ?? CATEGORIES[0].slug),
  ).slice(0, 3)

  return (
    <nav ref={ref} className="relative border-b border-border bg-card" aria-label={lang === 'ar' ? 'التصنيفات' : 'Categories'}>
      <div className="mx-auto flex max-w-7xl items-center px-4">
        {/* All categories trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent py-3 pe-4 text-sm font-semibold text-foreground transition-colors hover:text-primary data-[open=true]:border-primary data-[open=true]:text-primary"
          data-open={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          {t('allCategories')}
          <ChevronDown className={`size-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Horizontal quick-access strip — root categories */}
        <div className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <CategoryIcon name={c.icon} className="size-4 text-primary" />
              {lang === 'ar' ? c.nameAr : c.nameEn}
            </Link>
          ))}
        </div>
      </div>

      {/* Mega panel */}
      {open && (
        <div
          className="absolute start-0 top-full z-50 w-full border-b border-border bg-card shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr] gap-0">
            {/* Left: root category list */}
            <div className="border-e border-border bg-accent/30 py-3">
              {CATEGORIES.map((c) => {
                const isActive = (activeSlug ?? CATEGORIES[0].slug) === c.slug
                return (
                  <button
                    key={c.slug}
                    onMouseEnter={() => setActiveSlug(c.slug)}
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-card font-semibold text-primary'
                        : 'text-foreground hover:bg-card/70 hover:text-primary'
                    }`}
                  >
                    <CategoryIcon name={c.icon} className="size-4 shrink-0 text-primary" />
                    <span className="flex-1 text-start">{lang === 'ar' ? c.nameAr : c.nameEn}</span>
                    {lang === 'ar'
                      ? <ChevronLeft className="size-3.5 opacity-40" />
                      : <ChevronRight className="size-3.5 opacity-40" />
                    }
                  </button>
                )
              })}
            </div>

            {/* Right: sub-categories tree + featured products */}
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <CategoryIcon name={activeCategory.icon} className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {lang === 'ar' ? activeCategory.nameAr : activeCategory.nameEn}
                </h3>
                <Link
                  href={`/category/${activeCategory.slug}`}
                  onClick={() => setOpen(false)}
                  className="ms-auto flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {t('seeAll')}
                  {lang === 'ar'
                    ? <ChevronLeft className="size-3.5" />
                    : <ChevronRight className="size-3.5" />
                  }
                </Link>
              </div>

              {/* Sub-categories as pill links — hierarchical */}
              {activeCategory.children && activeCategory.children.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {activeCategory.children.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/category/${sub.slug}`}
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {lang === 'ar' ? sub.nameAr : sub.nameEn}
                      {sub.children && sub.children.length > 0 && (
                        <span className="ms-1 opacity-50">›</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Featured products */}
              {featuredProducts.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {featuredProducts.map((p) => {
                    const name = lang === 'ar' ? p.nameAr : p.nameEn
                    const price = role === 'merchant' ? p.basePrice : retailPriceUsd(p)
                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-accent" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">{name}</p>
                        <p className="text-xs font-bold text-primary">{formatPrice(price)}</p>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('noResults')}</p>
              )}

              {/* Bottom quick links */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  href={`/category/${activeCategory.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-accent/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <TrendingUp className="size-3.5 text-primary" />
                  {lang === 'ar' ? 'الأكثر مبيعاً' : 'Best sellers'}
                </Link>
                <Link
                  href={`/category/${activeCategory.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-accent/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Tag className="size-3.5 text-primary" />
                  {lang === 'ar' ? 'عروض التصنيف' : 'Category deals'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export function SiteHeader() {
  const { t, lang, setLang, country, setCountry, brand, brandLogo } = useI18n()
  const { count } = useCart()
  const { openCart } = useMiniCart()
  const { count: wishlistCount } = useWishlist()
  const { role, isLoggedIn, isPending: authPending } = useRole()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roleMeta = ROLE_META[role] ?? ROLE_META.consumer
  const RoleIcon = roleMeta.icon

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top utility bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/partner/sign-up" className="flex items-center gap-1 hover:opacity-80">
              <Store className="size-3.5" />
              {t('sellWithUs')}
            </Link>
            <span className="opacity-40">|</span>
            <Link href="/partner/sign-in" className="flex items-center gap-1 hover:opacity-80">
              <Truck className="size-3.5" />
              {t('authPortalPartner')}
            </Link>
            <span className="opacity-40">|</span>
            <Link
              href="/admin/sign-in"
              className="flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold transition-colors hover:bg-primary-foreground/20 hover:opacity-100"
            >
              <LayoutDashboard className="size-3.5" />
              {t('authPortalAdmin')}
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle className="size-7" />
            <span className="opacity-40">|</span>
            {/* Role badge (from session — not switchable) */}
            <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium opacity-90">
              <RoleIcon className="size-3.5" />
              <span className="hidden sm:inline">{t(roleMeta.key)}</span>
            </span>
            <span className="opacity-40">|</span>
            <Dropdown
              icon={<Globe className="size-3.5" />}
              label={LANG_LABEL[lang]}
              aria-label={`Language: ${LANG_LABEL[lang]}`}
            >
              {(close) =>
                LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l)
                      close()
                    }}
                    aria-label={LANG_LABEL[l]}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-accent ${
                      lang === l ? 'font-bold text-primary' : ''
                    }`}
                  >
                    {lang === l && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
                    {lang !== l && <span className="size-1.5" aria-hidden />}
                    {LANG_LABEL[l]}
                  </button>
                ))
              }
            </Dropdown>
            <span className="opacity-40">|</span>
            <Dropdown label={`${country.flag} ${country.currency}`}>
              {(close) =>
                COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code)
                      close()
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-accent ${
                      country.code === c.code ? 'font-bold text-primary' : ''
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span className="flex-1">{lang === 'ar' ? c.nameAr : c.nameEn}</span>
                    <span className="text-xs text-muted-foreground">{c.currency}</span>
                  </button>
                ))
              }
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-lg font-black text-primary-foreground">
              {brandLogo}
            </span>
            <span className="text-2xl font-black tracking-tight text-primary">{brand}</span>
          </Link>

          <div className="mx-auto hidden max-w-2xl flex-1 md:flex">
            <HeaderSearch />
          </div>

          <div className="ms-auto flex items-center gap-1 md:ms-0">
            {/* Notifications bell */}
            <NotificationsPanel />

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative grid size-9 place-items-center rounded-md hover:bg-accent"
              aria-label={lang === 'ar' ? 'المفضلة' : 'Wishlist'}
            >
              <Heart className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* أثناء تحميل الجلسة لا نُظهر أي حالة حتى لا يومض زر الدخول للمسجّلين */}
            {!authPending && (isLoggedIn ? (
              <Link
                href="/account"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent lg:flex"
              >
                <User className="size-4" />
                {t('account')}
              </Link>
            ) : (
              <Link
                href="/auth"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent md:flex"
              >
                <User className="size-4" />
                {t('login')}
              </Link>
            ))}
            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('cart')}
            >
              <div className="relative">
                <ShoppingCart className="size-6" />
                {count > 0 && (
                  <span className="absolute -end-2 -top-2 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {count}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline">{t('cart')}</span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 md:hidden">
          <HeaderSearch variant="mobile" onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Mega Menu */}
      <MegaMenu />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-card lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            {!authPending && (isLoggedIn ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                <User className="size-4" />
                {t('account')}
              </Link>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                <User className="size-4" />
                {t('login')} / {t('signup')}
              </Link>
            ))}
            <Link
              href="/partner/sign-up"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              <Store className="size-4" />
              {t('becomeSupplier')}
            </Link>
            <Link
              href="/partner/sign-in"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              <LayoutDashboard className="size-4" />
              {t('authPortalPartner')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
