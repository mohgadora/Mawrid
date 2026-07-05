'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, InboxIcon } from 'lucide-react'
import { getAdminBuyers } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { Input } from '@/components/ui/input'

export default function AdminBuyersPage() {
  const { t, formatPrice } = useI18n()
  const [q, setQ] = useState('')
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getAdminBuyers>>>('admin/buyers', getAdminBuyers)

  const filtered = (data ?? []).filter((b) => !q || b.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5 route-fade">
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('searchBuyer')} className="h-9 ps-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} />
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-start font-medium">{t('buyerId')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('buyerName')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('buyerType')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('ordersCount')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('buyerSpend')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('joinedDate')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{b.id}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">{b.name}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{b.type}</td>
                      <td className="px-5 py-3 text-xs text-foreground">{b.orders}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">{formatPrice(b.spend)}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{b.joined}</td>
                      <td className="px-5 py-3"><AdminStatusChip status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
