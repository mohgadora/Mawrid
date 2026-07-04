'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Heart, User, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  icon: LucideIcon
  key: 'home' | 'categories' | 'cart' | 'wishlist' | 'account'
  labelAr: string
  labelEn: string
}

const ITEMS: NavItem[] = [
  { href: '/', icon: Home, key: 'home', labelAr: 'الرئيسية', labelEn: 'Home' },
  { href: '/search', icon: LayoutGrid, key: 'categories', labelAr: 'التصنيفات', labelEn: 'Categories' },
  { href: '/cart', icon: ShoppingCart, key: 'cart', labelAr: 'السلة', labelEn: 'Cart' },
  { href: '/wishlist', icon: Heart, key: 'wishlist', labelAr: 'المفضلة', labelEn: 'Wishlist' },
  { href: '/account', icon: User, key: 'account', labelAr: 'حسابي', labelEn: 'Account' },
]

/** Mobile-only bottom navigation bar. Hidden on lg+. */
export function BottomNav() {
  const { lang } = useI18n()
  const { count } = useCart()
  const { count: wishlistCount } = useWishlist()
  const pathname = usePathname()

  return (
    <nav
      aria-label={lang === 'ar' ? 'التنقل السفلي' : 'Bottom navigation'}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-6" />
                  {item.key === 'cart' && count > 0 && (
                    <span className="absolute -end-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                  {item.key === 'wishlist' && wishlistCount > 0 && (
                    <span className="absolute -end-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  )}
                </span>
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
