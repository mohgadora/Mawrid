'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { use, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Loader,
  Package,
  Truck,
  Bike,
  Home,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { fetchPartnerOrder, updatePartnerOrderStatusApi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { StatusChip } from '@/components/order-status'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast'
import { useI18n, type DictKey } from '@/lib/i18n'

// Mirrors the server workflow in app/api/v1/partner/orders/[id]/route.ts.
// The server re-validates every transition, so this map only drives which
// action buttons to offer — an out-of-date entry fails safe with a toast.
type ActionMeta = { labelKey: DictKey; icon: LucideIcon; variant: 'default' | 'destructive' }

const ACTION_META: Record<string, ActionMeta> = {
  confirmed:        { labelKey: 'orderActionConfirm',        icon: CheckCircle2, variant: 'default' },
  processing:       { labelKey: 'orderActionProcess',        icon: Loader,       variant: 'default' },
  packed:           { labelKey: 'orderActionPack',           icon: Package,      variant: 'default' },
  shipped:          { labelKey: 'orderActionShip',           icon: Truck,        variant: 'default' },
  out_for_delivery: { labelKey: 'orderActionOutForDelivery', icon: Bike,         variant: 'default' },
  delivered:        { labelKey: 'orderActionDeliver',        icon: Home,         variant: 'default' },
  cancelled:        { labelKey: 'orderActionCancel',         icon: XCircle,      variant: 'destructive' },
}

const NEXT_TRANSITIONS: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['packed'],
  packed:           ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
}

export default function PartnerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR(`partner/order/${id}`, () => fetchPartnerOrder(id))
  const [pending, setPending] = useState<string | null>(null)

  async function advance(next: string) {
    setPending(next)
    try {
      await updatePartnerOrderStatusApi(id, next)
      await mutate()
      success(t('toastOrderStatusUpdated'))
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('toastSaveFailed'))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/partner/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowRight className="size-4 rtl:rotate-180" /> {t('back')}
      </Link>
      <AsyncContent data={data} error={error} isLoading={isLoading} onRetry={() => mutate()}>
        {(order) => {
          const nexts = NEXT_TRANSITIONS[order.status] ?? []
          return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono text-lg font-bold">{order.ref}</h2>
                  <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <StatusChip status={order.status as Parameters<typeof StatusChip>[0]['status']} />
              </div>
              {order.address && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {order.address.label} — {order.address.line1}, {order.address.city} · <span dir="ltr">{order.address.phone}</span>
                </p>
              )}
              {/* Fulfilment actions — advance the order along the workflow */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {nexts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('orderNoActions')}</p>
                ) : (
                  nexts.map((next) => {
                    const meta = ACTION_META[next]
                    if (!meta) return null
                    const Icon = meta.icon
                    const busy = pending === next
                    return (
                      <Button
                        key={next}
                        variant={meta.variant}
                        size="sm"
                        className="gap-1.5"
                        disabled={pending !== null}
                        onClick={() => advance(next)}
                      >
                        <Icon className={busy ? 'size-3.5 animate-spin' : 'size-3.5'} />
                        {t(meta.labelKey)}
                      </Button>
                    )
                  })
                )}
              </div>
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
          )
        }}
      </AsyncContent>
    </div>
  )
}
