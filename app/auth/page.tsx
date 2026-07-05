'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Handshake, Shield, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { PORTAL_SIGN_IN } from '@/lib/auth-portals'

const PORTALS = [
  {
    key: 'store' as const,
    icon: ShoppingBag,
    titleKey: 'authPortalStore',
    descKey: 'authPortalStoreDesc',
    href: PORTAL_SIGN_IN.store,
    accent: 'border-primary/30 bg-primary/5 hover:border-primary/50',
    iconClass: 'text-primary',
  },
  {
    key: 'partner' as const,
    icon: Handshake,
    titleKey: 'authPortalPartner',
    descKey: 'authPortalPartnerDesc',
    href: PORTAL_SIGN_IN.partner,
    accent: 'border-chart-3/30 bg-chart-3/5 hover:border-chart-3/50',
    iconClass: 'text-chart-3',
  },
  {
    key: 'admin' as const,
    icon: Shield,
    titleKey: 'authPortalAdmin',
    descKey: 'authPortalAdminDesc',
    href: PORTAL_SIGN_IN.admin,
    accent: 'border-destructive/20 bg-destructive/5 hover:border-destructive/40',
    iconClass: 'text-destructive',
  },
]

export default function AuthHubPage() {
  const { t, brand } = useI18n()
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{brand}</h1>
          <p className="text-muted-foreground">{t('authHubTitle')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PORTALS.map((p) => {
            const Icon = p.icon
            return (
              <Link
                key={p.key}
                href={p.href}
                className={`group flex flex-col items-center rounded-2xl border p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${p.accent}`}
              >
                <span className={`mb-4 grid size-14 place-items-center rounded-xl bg-card ring-1 ring-border ${p.iconClass}`}>
                  <Icon className="size-7" />
                </span>
                <h2 className="text-base font-bold text-foreground">{t(p.titleKey as Parameters<typeof t>[0])}</h2>
                <p className="mt-2 text-pretty text-xs text-muted-foreground">{t(p.descKey as Parameters<typeof t>[0])}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t('login')} <ArrowLeft className="size-3 rtl:rotate-180" />
                </span>
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">{t('authHubHint')}</p>
      </div>
    </main>
  )
}
