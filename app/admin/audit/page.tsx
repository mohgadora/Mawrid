'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, Download } from 'lucide-react'
import { getAuditLogs } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InboxIcon } from 'lucide-react'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  approved_supplier: { label: 'قبول مورد',       color: 'text-primary bg-primary/10' },
  rejected_kyc:      { label: 'رفض KYC',          color: 'text-destructive bg-destructive/10' },
  payout_run:        { label: 'صرف مدفوعات',      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950' },
  updated_config:    { label: 'تحديث إعدادات',    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  deleted_product:   { label: 'حذف منتج',         color: 'text-destructive bg-destructive/10' },
}

export default function AuditPage() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getAuditLogs>>>('admin/audit', getAuditLogs)

  const filtered = (data ?? []).filter((l) =>
    !query || l.user.includes(query) || l.target.includes(query) || l.action.includes(query)
  )

  return (
    <div className="space-y-5 route-fade">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-72 ps-9 text-sm"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
          <Download className="size-4" /> {t('exportCsv')}
        </Button>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {() => (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-start font-medium">{t('auditUser')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('auditAction')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('auditTarget')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('auditIp')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('auditTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => {
                    const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-muted-foreground bg-muted' }
                    return (
                      <tr key={log.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {log.user === 'System' ? 'S' : log.user[0]}
                            </div>
                            <span className="text-xs font-medium text-foreground">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{log.target}</td>
                        <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">{log.ip}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{log.at}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
