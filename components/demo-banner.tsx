'use client'

import { useI18n } from '@/lib/i18n'

export function DemoBanner({ feature }: { feature: string }) {
  const { t, lang } = useI18n()
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200"
    >
      {lang === 'ar'
        ? `عرض تجريبي — ${feature} غير متصل بالخادم بعد`
        : `Demo — ${feature} is not connected to the server yet`}
    </div>
  )
}
