'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, ShoppingCart } from 'lucide-react'
import { getAdminOrders } from '@/lib/api-client'
import { StatusChip } from '@/components/order-status'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_TABS: Array<OrderStatus | 'all'> = [
  'all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled',
]

export default function AdminOrdersPage() {
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getAdminOrders>>>('admin/orders', getAdminOrders)
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [q, setQ] = useState('')

  const STATUS_LABEL: Record<OrderStatus | 'all', string> = {
    all: t('filterAll'),
    pending: t('statusPending'),
    confirmed: t('statusConfirmed'),
    shipped: t('statusShipped'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-9 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton rows={6} cards={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={ShoppingCart} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(orders) => {
          const filtered = orders.filter((o) => {
            const matchTab = tab === 'all' || o.status === tab
            const matchQ = !q || o.id.includes(q) || o.buyer.includes(q) || o.supplier.includes(q)
            return matchTab && matchQ
          })
          return (
            <div className="rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-5 py-3 text-start font-medium">{t('orderId')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('buyerLabel')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('supplierLabel')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('itemsLabel')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('amountLabel')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('dateLabel')}</th>
                      <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{o.id}</td>
                        <td className="px-5 py-3 text-xs text-foreground">{o.buyer}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{o.supplier}</td>
                        <td className="px-5 py-3 text-xs text-foreground">{o.items}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-foreground">{formatPrice(o.amount)}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{o.date}</td>
                        <td className="px-5 py-3"><StatusChip status={o.status as Parameters<typeof StatusChip>[0]['status']} size="sm" /></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }}
      </AsyncContent>
    </div>
  )
}
