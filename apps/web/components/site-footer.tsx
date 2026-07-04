'use client'

import Link from 'next/link'
import { Store, Truck, ShieldCheck, Wallet, Headphones } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function SiteFooter() {
  const { t, brand, brandLogo } = useI18n()

  const columns: { title: string; links: string[] }[] = [
    { title: t('company'), links: [t('aboutUs'), t('careers'), t('contact')] },
    { title: t('support'), links: [t('helpCenter'), t('shipping2'), t('returns')] },
    {
      title: t('forBusiness'),
      links: [t('sellWithUs'), t('deliveryPartner'), t('pricing')],
    },
  ]

  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-lg font-black text-primary-foreground">
              {brandLogo}
            </span>
            <span className="text-2xl font-black text-primary">{brand}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('footerAbout')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { icon: Truck, label: t('fastDelivery') },
              { icon: ShieldCheck, label: t('orderProtection') },
              { icon: Wallet, label: t('securePayment') },
            ].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-bold text-foreground">{col.title}</h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link}>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {brand}. {t('rights')}.
          </p>
          <span className="flex items-center gap-1.5">
            <Headphones className="size-4" />
            {t('helpCenter')}
          </span>
        </div>
      </div>
    </footer>
  )
}
