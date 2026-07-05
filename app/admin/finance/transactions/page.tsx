'use client'

import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { getTransactions } from '@/lib/api-client'
import { StatusChip } from '@/components/order-status'
import type { OrderStatus } from '@/lib/order-types'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { InboxIcon } from 'lucide-react'

const TXN_STATUS: Record<string, OrderStatus> = {
  completed: 'delivered',
  processed: 'packed',
  pending:   'pending',
  failed:    'cancelled',
  refunded:  'cancelled',
}

export default function TransactionsPage() {
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getTransactions>>>('admin/transactions', getTransactions)

  return (
    <div className="route-fade space-y-5">
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(txns) => (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-start font-medium">{t('orderId')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('txnType')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('txnParty')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('amountLabel')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('txnFee')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('txnNet')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('dateLabel')}</th>
                    <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{txn.id}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                          {txn.type === 'sale' ? t('txnType') : txn.type === 'refund' ? t('adminDisputes') : t('adminPayouts')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-foreground">{txn.party}</td>
                      <td className={cn('px-5 py-3 text-xs font-bold', txn.amount >= 0 ? 'text-foreground' : 'text-destructive')}>
                        {formatPrice(txn.amount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatPrice(txn.fee)}</td>
                      <td className={cn('px-5 py-3 text-xs font-bold', txn.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                        {formatPrice(txn.net)}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{txn.date}</td>
                      <td className="px-5 py-3">
                        <StatusChip status={TXN_STATUS[txn.status] ?? 'pending'} size="sm" />
                      </td>
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
