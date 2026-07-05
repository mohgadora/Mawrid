'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Search, MessageSquare, InboxIcon } from 'lucide-react'
import { getSupportTickets } from '@/lib/api-client'
import type { TicketPriority } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { Input } from '@/components/ui/input'

const PRIORITY_AR: Record<TicketPriority, string> = { urgent: 'عاجل جداً', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: 'text-destructive', high: 'text-orange-500', medium: 'text-yellow-500', low: 'text-muted-foreground',
}

export default function SupportTicketsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [q, setQ] = useState('')
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getSupportTickets>>>('admin/tickets', getSupportTickets)

  const filtered = (data ?? []).filter(
    (tk) => !q || tk.subject.includes(q) || tk.user.includes(q) || tk.id.includes(q)
  )

  return (
    <div className="space-y-5 route-fade">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('searchTickets')} className="h-9 ps-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {() => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">{t('ticketId')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('ticketSubject')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('userLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('priorityLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('dateLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('actionLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tk) => (
                  <tr key={tk.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{tk.id}</td>
                    <td className="px-5 py-3 text-xs font-medium text-foreground">{tk.subject}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{tk.user}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${PRIORITY_COLOR[tk.priority]}`}>
                        {PRIORITY_AR[tk.priority]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{tk.created}</td>
                    <td className="px-5 py-3"><AdminStatusChip status={tk.status} /></td>
                    <td className="px-5 py-3">
                      <button onClick={() => router.push(`/admin/support/tickets/${tk.id}`)} className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground transition-colors hover:bg-accent/80">
                        <MessageSquare className="size-3" /> {t('openLabel')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
