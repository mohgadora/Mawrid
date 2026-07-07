'use client'

import { useState } from 'react'
import { PackageSearch, ArrowLeft, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { RequestProductModal } from '@/components/request-product-modal'

export function RequestProductBanner() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-5 py-4 sm:px-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <PackageSearch className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground sm:text-base">
              {t('requestProductTitle')}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
              {t('requestProductSubtitle')}
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {t('requestProductSubmit')}
            <ArrowIcon className="size-4" />
          </button>
        </div>
      </section>

      {open && <RequestProductModal onClose={() => setOpen(false)} />}
    </>
  )
}
