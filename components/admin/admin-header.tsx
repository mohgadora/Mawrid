'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bell, Sun, Moon, Menu, X, ArrowLeft, Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n, LANGS, LANG_LABEL, type DictKey } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useSidebar } from '@/components/admin/admin-sidebar'
import useSWR from 'swr'
import { fetchAdminKpi } from '@/lib/api-client'

/** Accessible 5-language dropdown for the admin header */
function AdminLangPicker() {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Globe className="size-3.5" />
        <span>{LANG_LABEL[lang]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('language')}
          className="absolute end-0 top-full z-50 mt-1 min-w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
        >
          {LANGS.map((l) => (
            <li key={l} role="option" aria-selected={lang === l}>
              <button
                type="button"
                onClick={() => { setLang(l); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors hover:bg-accent ${
                  lang === l ? 'font-bold text-primary' : 'text-foreground'
                }`}
              >
                {lang === l
                  ? <Check className="size-3.5 shrink-0 text-primary" />
                  : <span className="size-3.5 shrink-0" />
                }
                {LANG_LABEL[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* Map each admin pathname to its i18n key */
const ROUTE_LABEL_KEYS: Record<string, DictKey> = {
  '/admin': 'adminOverview',
  '/admin/approvals': 'adminApprovals',
  '/admin/brands': 'adminBrands',
  '/admin/attributes': 'adminAttributes',
  '/admin/units': 'adminUnits',
  '/admin/orders': 'adminOrders',
  '/admin/disputes': 'adminDisputes',
  '/admin/suppliers': 'adminSuppliers',
  '/admin/buyers': 'adminBuyers',
  '/admin/support/tickets': 'adminTickets',
  '/admin/support/chats': 'adminChats',
  '/admin/segments': 'adminSegments',
  '/admin/campaigns': 'adminCampaigns',
  '/admin/loyalty': 'adminLoyalty',
  '/admin/referrals': 'adminReferrals',
  '/admin/finance/payouts': 'adminPayouts',
  '/admin/finance/transactions': 'adminTransactions',
  '/admin/finance/taxes': 'adminTaxes',
  '/admin/countries': 'adminCountries',
  '/admin/zones': 'adminZones',
  '/admin/shipping': 'adminShipping',
  '/admin/apps': 'adminApps',
  '/admin/apps/versions': 'adminVersions',
  '/admin/apps/config': 'adminAppConfig',
  '/admin/apps/banners': 'adminBanners',
  '/admin/apps/force-update': 'adminForceUpdate',
  '/admin/content/pages': 'adminPages',
  '/admin/content/faq': 'adminFaq',
  '/admin/content/announcements': 'adminAnnouncements',
  '/admin/roles': 'adminRoles',
  '/admin/audit': 'adminAudit',
  '/admin/api-keys': 'adminApiKeys',
  '/admin/sessions': 'adminSessions',
  '/admin/integrations': 'adminIntegrations',
  '/admin/notifications-center': 'adminNotificationsCenter',
  '/admin/health': 'adminHealth',
  '/admin/logs': 'adminLogs',
  '/admin/account': 'adminAccount',
}

export function AdminHeader() {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const { theme, toggle } = useTheme()
  const { open, toggle: toggleSidebar } = useSidebar()
  const { data: kpiData } = useSWR<Awaited<ReturnType<typeof fetchAdminKpi>>>('admin/kpi', fetchAdminKpi)

  const labelKey = ROUTE_LABEL_KEYS[pathname] ?? 'adminPanel'
  const pendingCount = kpiData?.kpi?.pendingApprovals ?? 0

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 lg:px-5">

      {/* Hamburger — mobile/tablet only */}
      <button
        onClick={toggleSidebar}
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent lg:hidden"
        aria-label={open ? t('close') : 'فتح القائمة'}
        aria-expanded={open}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Page title */}
      <h1 className="truncate text-sm font-bold text-foreground">{t(labelKey)}</h1>

      <div className="flex-1" />

      {/* Language picker — 5-language dropdown */}
      <AdminLangPicker />

      {/* Notifications badge */}
      <Button variant="ghost" size="icon" className="relative size-9 shrink-0" aria-label={t('adminTickets')}>
        <Bell className="size-4" />
        {pendingCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {pendingCount}
          </span>
        )}
      </Button>

      {/* Theme toggle — uses the shared ThemeProvider, no FOUC */}
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        onClick={toggle}
        aria-label={t('toggleTheme')}
        aria-pressed={theme === 'dark'}
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      {/* Back to store */}
      <Link
        href="/"
        className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
      >
        <ArrowLeft className="size-3.5" />
        <span className="hidden md:inline">{t('backToStore')}</span>
        <span className="md:hidden">{lang === 'ar' ? 'المتجر' : 'Store'}</span>
      </Link>
    </header>
  )
}
