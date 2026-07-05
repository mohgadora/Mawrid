'use client'

import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

/**
 * بانر يظهر أعلى بوابة الشريك عندما يكون الأدمن "داخلاً كمتجر".
 * يستعلم عن الحالة من الخادم (لا يثق بالمتصفّح)، ويتيح إنهاء الانتحال.
 */
export function ImpersonationBanner() {
  const { t } = useI18n()
  const [state, setState] = useState<{ active: boolean; supplierName?: string } | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/v1/admin/impersonate')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setState(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (!state?.active) return null

  async function exit() {
    setExiting(true)
    try {
      await fetch('/api/v1/admin/impersonate', { method: 'DELETE' })
      window.location.href = '/admin/suppliers'
    } finally {
      setExiting(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950" dir="rtl">
      <span className="flex items-center gap-2">
        <Eye className="size-4" />
        {t('impersonatingAs')}: {state.supplierName}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        className="flex items-center gap-1 rounded-md bg-amber-950/10 px-3 py-1 hover:bg-amber-950/20 disabled:opacity-50"
      >
        <X className="size-3.5" />
        {t('exitImpersonation')}
      </button>
    </div>
  )
}
