'use client'

import Link from 'next/link'
import { Store, Truck, ShieldCheck, Wallet, Headphones } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

/* ── Inline SVG social icons (no extra package needed) ── */
function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}
function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
function IconSnapchat() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M12.065.001c1.731-.012 3.38.476 4.679 1.56.897.74 1.515 1.75 1.856 2.84.169.537.218 1.09.239 1.647.025.634.035 1.268.066 1.901.023.483.097.965.266 1.422.11.299.273.575.506.795.261.246.577.38.912.466a4.1 4.1 0 0 0 1.038.115c.218 0 .438-.02.655-.063.15-.03.3-.065.453-.073.167-.01.335.02.487.086.293.127.44.357.44.64 0 .33-.21.59-.501.743-.208.108-.432.18-.657.24-.067.018-.134.034-.2.054-.577.18-.982.514-1.1 1.117-.038.198.002.38.068.558.254.69.703 1.24 1.208 1.757.41.42.855.8 1.35 1.098.24.144.49.266.756.339.162.044.327.07.49.11.197.05.364.151.455.343.052.11.062.228.025.345-.1.322-.38.507-.7.604-.284.086-.576.113-.869.154-.397.055-.786.148-1.15.328-.29.143-.547.343-.788.559a.644.644 0 0 0-.205.386c-.022.147.007.286.059.424.175.454.432.845.711 1.22.17.227.343.45.493.693.2.322.34.67.335 1.055-.004.357-.13.681-.377.946-.296.32-.686.497-1.097.603-.558.144-1.12.214-1.688.264-.434.038-.872.043-1.305.09-.376.04-.742.118-1.07.315-.275.163-.506.38-.74.592-.42.384-.832.775-1.33 1.04-.567.299-1.166.428-1.806.412-.594-.015-1.152-.166-1.666-.449-.477-.265-.88-.631-1.272-.995-.26-.241-.518-.48-.804-.681-.385-.27-.812-.408-1.277-.45-.44-.04-.88-.048-1.32-.087-.53-.046-1.059-.11-1.578-.228-.49-.112-.953-.29-1.347-.605-.259-.207-.45-.47-.485-.804-.03-.28.06-.527.207-.76.178-.283.38-.545.577-.813.247-.337.48-.682.661-1.059.057-.118.104-.241.107-.372.004-.168-.049-.327-.154-.457a3.42 3.42 0 0 0-.45-.449c-.331-.278-.7-.476-1.096-.61-.406-.137-.825-.187-1.246-.245-.218-.03-.436-.062-.641-.14-.327-.122-.609-.33-.703-.678-.04-.147-.032-.294.026-.436.092-.22.268-.332.476-.4.17-.057.344-.088.518-.124.144-.03.29-.063.425-.121.422-.18.722-.497 1.003-.843.368-.455.638-.97.808-1.522.062-.202.1-.41.07-.62-.044-.3-.22-.524-.454-.706-.432-.336-.914-.57-1.398-.796a4.07 4.07 0 0 1-.49-.268c-.268-.177-.47-.415-.47-.742 0-.287.152-.52.446-.643.152-.063.312-.09.473-.08.153.008.3.04.452.072.217.044.435.066.654.062a4.07 4.07 0 0 0 .912-.114c.336-.086.653-.22.914-.467.233-.22.397-.496.506-.795.17-.457.243-.939.266-1.422.031-.633.041-1.267.066-1.9.021-.558.07-1.111.239-1.648.34-1.09.96-2.1 1.856-2.84C8.685.477 10.334-.01 12.065 0z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { href: 'https://twitter.com', label: 'X (Twitter)', icon: IconX },
  { href: 'https://instagram.com', label: 'Instagram', icon: IconInstagram },
  { href: 'https://facebook.com', label: 'Facebook', icon: IconFacebook },
  { href: 'https://snapchat.com', label: 'Snapchat', icon: IconSnapchat },
  { href: 'https://youtube.com', label: 'YouTube', icon: IconYouTube },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: IconLinkedIn },
]

export function SiteFooter() {
  const { t, brand, brandLogo } = useI18n()

  const columns: { title: string; links: string[] }[] = [
    { title: t('company'), links: [t('aboutUs'), t('careers'), t('contact')] },
    { title: t('support'), links: [t('helpCenter'), t('shipping2'), t('returns'), t('requestProductTitle')] },
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

          {/* Social media links */}
          <div className="mt-5">
            <p className="mb-2.5 text-xs font-semibold text-foreground">{t('followUs')}</p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-8 place-items-center rounded-lg border border-border bg-accent text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon />
                </a>
              ))}
            </div>
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
