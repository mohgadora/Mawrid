'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { use } from 'react'
import { ArrowRight } from 'lucide-react'
import { fetchPartnerOrder } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { StatusChip } from '@/components/order-status'
import { useI18n } from '@/lib/i18n'

export default function PartnerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR(`partner/order/${id}`, () => fetchPartnerOrder(id))

  return (
    <div className="space-y-4">
      <Link href="/partner/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowRight className="size-4 rtl:rotate-180" /> {t('back')}
      </Link>
      <AsyncContent data={data} error={error} isLoading={isLoading} onRetry={() => mutate()}>
        {(order) => (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono text-lg font-bold">{order.ref}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <StatusChip status={order.status as Parameters<typeof StatusChip>[0]['status']} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {order.address.label} — {order.address.line1}, {order.address.city} · <span dir="ltr">{order.address.phone}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start">{t('nameLabel')}</th>
                    <th className="px-4 py-3 text-start">{t('qty')}</th>
                    <th className="px-4 py-3 text-start">{t('price')}</th>
                    <th className="px-4 py-3 text-start">{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 text-xs font-medium">{l.productName}</td>
                      <td className="px-4 py-3 text-xs">{l.qty}</td>
                      <td className="px-4 py-3 text-xs">{formatPrice(l.unitPrice)}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatPrice(l.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-border px-4 py-3 text-end text-sm font-bold">
                {t('total')}: {formatPrice(order.total)}
              </div>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
