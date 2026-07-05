'use client'

import useSWR from 'swr'
import { getPayouts } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { InboxIcon } from 'lucide-react'

export default function PayoutsPage() {
  const { t, formatPrice, lang } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getPayouts>>>('admin/payouts', getPayouts)

  const pending      = (data ?? []).filter((p) => p.status === 'pending')
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0)
  const completed    = (data ?? []).filter((p) => p.status === 'completed').length

  return (
    <div className="route-fade space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('kpiRevenue')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatPrice(pendingTotal)}</p>
          <p className="text-[11px] text-muted-foreground">{pending.length} {t('adminSuppliers')}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('dateLabel')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">5 {lang === 'ar' ? 'يوليو' : 'July'}</p>
          <p className="text-[11px] text-muted-foreground">2026</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('adminPayouts')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{completed}</p>
          <p className="text-[11px] text-muted-foreground">{t('statusCompleted')}</p>
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
        {(payouts) => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">{t('payoutId')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('supplierName')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('period')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('amountLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('dateLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{p.id}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-foreground">{p.supplier}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.period}</td>
                    <td className="px-5 py-3 text-xs font-bold text-foreground">{formatPrice(p.amount)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.date}</td>
                    <td className="px-5 py-3"><AdminStatusChip status={p.status} /></td>
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
