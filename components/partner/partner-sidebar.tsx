'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Store,
  X, LogOut, Menu, TrendingUp, Warehouse, CreditCard,
  Star, Headphones, Bell, BarChart2, ClipboardList,
  ChevronDown, Building2, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { authClient } from '@/lib/auth-client'
import { useToast } from '@/lib/toast'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'

type SidebarCtx = { open: boolean; toggle: () => void; close: () => void }
const Ctx = createContext<SidebarCtx>({ open: false, toggle: () => {}, close: () => {} })
export const usePartnerSidebar = () => useContext(Ctx)

export function PartnerSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

const NAV = [
  { href: '/partner', icon: LayoutDashboard, labelKey: 'partnerNavDashboard' },
  { href: '/partner/store', icon: Store, labelKey: 'partnerNavStore' },
  { href: '/partner/products', icon: Package, labelKey: 'partnerNavProducts' },
  { href: '/partner/inventory', icon: Warehouse, labelKey: 'partnerNavInventory' },
  { href: '/partner/orders', icon: ShoppingCart, labelKey: 'partnerNavOrders' },
  { href: '/partner/earnings', icon: TrendingUp, labelKey: 'partnerNavEarnings' },
  { href: '/partner/withdrawals', icon: CreditCard, labelKey: 'partnerNavWithdrawals' },
  { href: '/partner/reviews', icon: Star, labelKey: 'partnerNavReviews' },
  { href: '/partner/reports', icon: BarChart2, labelKey: 'partnerNavReports' },
  { href: '/partner/support', icon: Headphones, labelKey: 'partnerNavSupport' },
  { href: '/partner/notifications', icon: Bell, labelKey: 'partnerNavNotifications' },
] as const

export function PartnerSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { open, close } = usePartnerSidebar()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={close} />}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-64 flex-col border-s border-border bg-card transition-transform duration-200 lg:relative lg:inset-auto lg:translate-x-0 lg:block',
        open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
      )}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-bold text-foreground">{t('authPortalPartner')}</span>
          <button type="button" className="lg:hidden" onClick={close}><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, icon: Icon, labelKey }) => {
            const active = href === '/partner' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={close} className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}>
                <Icon className="size-4" />
                {t(labelKey as Parameters<typeof t>[0])}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <Link href="/" className="block text-xs text-muted-foreground hover:text-foreground">{t('backToStore')}</Link>
        </div>
      </aside>
    </>
  )
}

// ── Store Switcher (admin only) ───────────────────────────────────────────────

type SupplierItem = { id: string; name: string; status: string }

function StoreSwitcher({ currentSupplierId }: { currentSupplierId?: string }) {
  const [open, setOpen] = useState(false)
  const [stores, setStores] = useState<SupplierItem[]>([])
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/v1/admin/suppliers-list')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setStores(j.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function switchTo(supplierId: string) {
    if (supplierId === currentSupplierId || switching) return
    setSwitching(true)
    setOpen(false)
    try {
      await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId }),
      })
      window.location.href = '/partner'
    } finally {
      setSwitching(false)
    }
  }

  if (!stores.length) return null

  const current = stores.find((s) => s.id === currentSupplierId)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors max-w-[180px]"
      >
        <Building2 className="size-3.5 shrink-0 text-primary" />
        <span className="truncate">{current?.name ?? 'اختر متجراً'}</span>
        <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card shadow-lg py-1 max-h-72 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            تبديل المتجر
          </p>
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => switchTo(s.id)}
              disabled={switching}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-start transition-colors hover:bg-accent',
                s.id === currentSupplierId && 'bg-primary/5 text-primary',
              )}
            >
              <Check className={cn('size-3.5 shrink-0', s.id === currentSupplierId ? 'opacity-100 text-primary' : 'opacity-0')} />
              <span className="min-w-0 truncate">{s.name}</span>
              {s.status !== 'active' && (
                <span className="ms-auto shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  معلق
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

export function PartnerHeader() {
  const { toggle } = usePartnerSidebar()
  const { t } = useI18n()
  const { info } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const title = NAV.find((n) => (n.href === '/partner' ? pathname === n.href : pathname.startsWith(n.href)))?.labelKey ?? 'partnerNavDashboard'
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentSupplierId, setCurrentSupplierId] = useState<string | undefined>()

  useEffect(() => {
    fetch('/api/v1/partner/notifications')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && typeof data.unread === 'number') setUnreadCount(data.unread)
      })
      .catch(() => {})

    // Check if current user is admin and get impersonation state
    fetch('/api/v1/admin/impersonate')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data?.active) {
          setIsAdmin(true)
          setCurrentSupplierId(data.data.supplierId)
        }
      })
      .catch(() => {})
  }, [pathname])

  async function logout() {
    await authClient.signOut()
    info(t('toastLoggedOut'))
    router.push('/partner/sign-in')
    router.refresh()
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <button type="button" onClick={toggle} className="rounded-md p-2 hover:bg-accent lg:hidden" aria-label="Menu">
        <Menu className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{t(title as Parameters<typeof t>[0])}</h1>

      {isAdmin && <StoreSwitcher currentSupplierId={currentSupplierId} />}

      <Link href="/partner/notifications" className="relative rounded-md p-2 hover:bg-accent" aria-label={t('partnerNavNotifications')}>
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
      <LanguageSwitcher />
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={logout}>
        <LogOut className="size-4 rtl:rotate-180" />
        <span className="hidden sm:inline">{t('logout')}</span>
      </Button>
    </header>
  )
}
