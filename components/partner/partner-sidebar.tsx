'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Store,
  X,
  LogOut,
  Menu,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { authClient } from '@/lib/auth-client'
import { useToast } from '@/lib/toast'
import { createContext, useContext, useState } from 'react'
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
  { href: '/partner/products', icon: Package, labelKey: 'partnerNavProducts' },
  { href: '/partner/orders', icon: ShoppingCart, labelKey: 'partnerNavOrders' },
  { href: '/partner/earnings', icon: TrendingUp, labelKey: 'partnerNavEarnings' },
  { href: '/partner/invoices', icon: Receipt, labelKey: 'partnerNavInvoices' },
  { href: '/partner/store', icon: Store, labelKey: 'partnerNavStore' },
] as const

export function PartnerSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { open, close } = usePartnerSidebar()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={close} />}
      <aside className={cn(
        'fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-border bg-card transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full',
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

export function PartnerHeader() {
  const { toggle } = usePartnerSidebar()
  const { t } = useI18n()
  const { info } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const title = NAV.find((n) => (n.href === '/partner' ? pathname === n.href : pathname.startsWith(n.href)))?.labelKey ?? 'partnerNavDashboard'

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
      <LanguageSwitcher />
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={logout}>
        <LogOut className="size-4 rtl:rotate-180" />
        <span className="hidden sm:inline">{t('logout')}</span>
      </Button>
    </header>
  )
}
