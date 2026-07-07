'use client'

import { useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { RequestProductModal } from '@/components/request-product-modal'

export function RequestProductButton() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <PackageSearch className="size-4 shrink-0" />
        {t('requestProductCta')}
      </button>

      {open && <RequestProductModal onClose={() => setOpen(false)} />}
    </>
  )
}
