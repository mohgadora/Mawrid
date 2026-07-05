'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, createContext, useContext } from 'react'
import {
  LayoutDashboard, ClipboardCheck, ShoppingCart, Users,
  Store, Tag, Ruler, Headphones, MessageSquare, AlertTriangle,
  Star, Gift, DollarSign, Receipt, Landmark, Globe, Map, Truck,
  Key, ScrollText, Wifi, Bell, Activity, FileText, UserCircle,
  Layers, ToggleLeft, Image, Smartphone, RefreshCw, BookOpen,
  HelpCircle, Megaphone, PieChart, ShieldCheck, X, Package,
  BarChart2, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n, type DictKey } from '@/lib/i18n'

/* ─── Sidebar context ───────────────────────────────────────── */
type SidebarCtx = { open: boolean; toggle: () => void; close: () => void }
const Ctx = createContext<SidebarCtx>({ open: false, toggle: () => {}, close: () => {} })
export const useSidebar = () => useContext(Ctx)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

/* ─── Nav schema ─────────────────────────────────────────────── */
type NavItem = { labelKey: DictKey; href: string; icon: React.ElementType; badge?: number }
type Section = { titleKey: DictKey; items: NavItem[] }

const NAV: Section[] = [
  {
    titleKey: 'adminOverview',
    items: [
      { labelKey: 'adminOverview', href: '/admin', icon: LayoutDashboard },
      { labelKey: 'adminApprovals', href: '/admin/approvals', icon: ClipboardCheck, badge: 47 },
    ],
  },
  {
    titleKey: 'adminCatalog',
    items: [
      { labelKey: 'adminProducts', href: '/admin/products', icon: Package },
      { labelKey: 'adminBrands', href: '/admin/brands', icon: Tag },
      { labelKey: 'adminAttributes', href: '/admin/attributes', icon: Layers },
      { labelKey: 'adminUnits', href: '/admin/units', icon: Ruler },
    ],
  },
  {
    titleKey: 'adminOrders',
    items: [
      { labelKey: 'adminOrders', href: '/admin/orders', icon: ShoppingCart },
      { labelKey: 'adminDisputes', href: '/admin/disputes', icon: AlertTriangle },
    ],
  },
  {
    titleKey: 'adminBuyers',
    items: [
      { labelKey: 'adminSuppliers', href: '/admin/suppliers', icon: Store },
      { labelKey: 'adminBuyers', href: '/admin/buyers', icon: Users },
    ],
  },
  {
    titleKey: 'adminSupport',
    items: [
      { labelKey: 'adminTickets', href: '/admin/support/tickets', icon: Headphones, badge: 83 },
      { labelKey: 'adminChats', href: '/admin/support/chats', icon: MessageSquare },
    ],
  },
  {
    titleKey: 'adminMarketing',
    items: [
      { labelKey: 'adminSegments', href: '/admin/segments', icon: PieChart },
      { labelKey: 'adminCampaigns', href: '/admin/campaigns', icon: Megaphone },
      { labelKey: 'adminLoyalty', href: '/admin/loyalty', icon: Star },
      { labelKey: 'adminReferrals', href: '/admin/referrals', icon: Gift },
    ],
  },
  {
    titleKey: 'adminFinance',
    items: [
      { labelKey: 'adminWithdrawals', href: '/admin/finance/withdrawals', icon: CreditCard },
      { labelKey: 'adminPayouts', href: '/admin/finance/payouts', icon: DollarSign },
      { labelKey: 'adminTransactions', href: '/admin/finance/transactions', icon: Receipt },
      { labelKey: 'adminTaxes', href: '/admin/finance/taxes', icon: Landmark },
    ],
  },
  {
    titleKey: 'adminReports',
    items: [
      { labelKey: 'adminReports', href: '/admin/reports', icon: BarChart2 },
    ],
  },
  {
    titleKey: 'adminGeography',
    items: [
      { labelKey: 'adminCountries', href: '/admin/countries', icon: Globe },
      { labelKey: 'adminZones', href: '/admin/zones', icon: Map },
      { labelKey: 'adminShipping', href: '/admin/shipping', icon: Truck },
    ],
  },
  {
    titleKey: 'adminLogistics',
    items: [
      { labelKey: 'adminDriverMap', href: '/admin/drivers/map', icon: Map },
    ],
  },
  {
    titleKey: 'adminApps',
    items: [
      { labelKey: 'adminApps', href: '/admin/apps', icon: Smartphone },
      { labelKey: 'adminVersions', href: '/admin/apps/versions', icon: RefreshCw },
      { labelKey: 'adminAppConfig', href: '/admin/apps/config', icon: ToggleLeft },
      { labelKey: 'adminBanners', href: '/admin/apps/banners', icon: Image },
      { labelKey: 'adminForceUpdate', href: '/admin/apps/force-update', icon: RefreshCw },
    ],
  },
  {
    titleKey: 'adminContent',
    items: [
      { labelKey: 'adminPages', href: '/admin/content/pages', icon: BookOpen },
      { labelKey: 'adminFaq', href: '/admin/content/faq', icon: HelpCircle },
      { labelKey: 'adminAnnouncements', href: '/admin/content/announcements', icon: Bell },
    ],
  },
  {
    titleKey: 'adminSecurity',
    items: [
      { labelKey: 'adminRoles', href: '/admin/roles', icon: ShieldCheck },
      { labelKey: 'adminAudit', href: '/admin/audit', icon: ScrollText },
      { labelKey: 'adminApiKeys', href: '/admin/api-keys', icon: Key },
      { labelKey: 'adminSessions', href: '/admin/sessions', icon: Wifi },
    ],
  },
  {
    titleKey: 'adminPlatform',
    items: [
      { labelKey: 'adminIntegrations', href: '/admin/integrations', icon: Layers },
      { labelKey: 'adminNotificationsCenter', href: '/admin/notifications-center', icon: Bell },
      { labelKey: 'adminHealth', href: '/admin/health', icon: Activity },
      { labelKey: 'adminLogs', href: '/admin/logs', icon: FileText },
    ],
  },
  {
    titleKey: 'adminSettings',
    items: [
      { labelKey: 'adminSettings', href: '/admin/settings', icon: ToggleLeft },
      { labelKey: 'adminCommission', href: '/admin/finance/commissions', icon: PieChart },
      { labelKey: 'adminCoupons', href: '/admin/coupons', icon: Gift },
      { labelKey: 'adminRefunds', href: '/admin/refunds', icon: AlertTriangle },
    ],
  },
  {
    titleKey: 'adminAccount',
    items: [
      { labelKey: 'adminAccount', href: '/admin/account', icon: UserCircle },
    ],
  },
]

/* ─── NavContent ─────────────────────────────────────────────── */
function NavContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold select-none">
          م
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-foreground">مَوْرِد</p>
          <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">{t('adminPanel')}</p>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-2 text-sm" aria-label={t('adminPanel')}>
        {NAV.map(({ titleKey, items }) => (
          <div key={titleKey} className="mb-0.5">
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t(titleKey)}
            </p>
            <ul className="space-y-0.5 px-2">
              {items.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                      {item.badge != null && (
                        <span
                          className={cn(
                            'min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-destructive/10 text-destructive',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold select-none">
            أ
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">أحمد العمري</p>
            <p className="truncate text-[10px] text-muted-foreground">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── AdminSidebar ───────────────────────────────────────────── */
export function AdminSidebar() {
  const { open, close } = useSidebar()
  const pathname = usePathname()

  useEffect(() => { close() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-0 h-screen overflow-hidden border-e border-border bg-card">
          <NavContent onNavigate={() => {}} />
        </div>
      </aside>

      {/* Mobile/tablet backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile/tablet drawer — slides from right in RTL layout */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 overflow-hidden border-s border-border bg-card shadow-2xl',
          'transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="القائمة الجانبية"
        aria-hidden={!open}
      >
        <button
          onClick={close}
          className="absolute left-3 top-3.5 z-10 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="إغلاق القائمة"
        >
          <X className="size-4" />
        </button>
        <NavContent onNavigate={close} />
      </aside>
    </>
  )
}
