'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { fetchPartnerOrders } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { StatusChip } from '@/components/order-status'
import { useI18n } from '@/lib/i18n'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PartnerOrdersPage() {
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR('partner/orders', fetchPartnerOrders)

  return (
    <AsyncContent data={data} error={error} isLoading={isLoading} loading={<AdminPageSkeleton rows={6} cards={0} />} onRetry={() => mutate()}>
      {(orders) => (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t('orderRef')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('statusLabel')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('templateItems')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('total')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.ref}</td>
                  <td className="px-4 py-3"><StatusChip status={o.status as Parameters<typeof StatusChip>[0]['status']} size="sm" /></td>
                  <td className="px-4 py-3 text-xs">{o.items}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/partner/orders/${o.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 gap-1 text-xs')}><Eye className="size-3.5" /> {t('viewProfile')}</Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AsyncContent>
  )
}
