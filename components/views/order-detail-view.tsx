'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { useState } from 'react'
import { MapPin, Truck, RefreshCw, XCircle, Package } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { StatusChip, OrderTimeline } from '@/components/order-status'
import { ProductDetailSkeleton } from '@/components/skeletons'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useCart, toCartSnapshot } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { useProducts } from '@/lib/use-products'
import { fetchOrder, cancelOrderApi } from '@/lib/api-client'

export function OrderDetailView({ id }: { id: string }) {
  const { t, lang, formatPrice } = useI18n()
  const { addItem } = useCart()
  const { products } = useProducts()
  const { success, error: toastError } = useToast()
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof fetchOrder>>>(['order', id], () => fetchOrder(id))

  async function handleCancel() {
    try {
      await cancelOrderApi(id)
      await mutate()
      success(t('toastOrderCancelled'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errorTitle')
      toastError(msg)
    } finally {
      setCancelOpen(false)
    }
  }

  function handleReorder(lines: { productId: string; qty: number }[]) {
    let added = 0
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId)
      if (product) {
        addItem(toCartSnapshot(product), line.qty)
        added++
      }
    }
    if (added > 0) success(t('toastAddedToCart'))
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={<ProductDetailSkeleton />}
        isEmpty={(d) => !d}
        empty={
          <EmptyState
            icon={Package}
            title={t('notFound')}
            actionLabel={t('myOrders')}
            actionHref="/orders"
          />
        }
      >
        {(rawData) => {
          if (!rawData) return null
          const data = rawData
          const canCancel = data.status !== 'delivered' && data.status !== 'cancelled'
          const isTracking = data.status === 'shipped' || data.status === 'out_for_delivery'
          return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{data.ref}</h1>
                  <StatusChip status={data.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('orderDate')}:{' '}
                  {new Date(data.createdAt).toLocaleDateString(
                    lang === 'ar' ? 'ar-SA' : 'en-US',
                    { day: 'numeric', month: 'long', year: 'numeric' },
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReorder(data.lines)}>
                  <RefreshCw className="size-4" />
                  {t('reorder')}
                </Button>
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setCancelOpen(true)}
                  >
                    <XCircle className="size-4" />
                    {t('cancelOrder')}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="flex flex-col gap-6">
                {/* Live tracking */}
                {isTracking && (
                  <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                      <Truck className="size-4 text-primary" />
                      <h2 className="font-semibold">{t('liveTracking')}</h2>
                    </div>
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <Image
                        src="/tracking-map.png"
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 640px"
                        className="object-cover"
                      />
                      <span className="absolute start-1/3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                        <span className="relative inline-flex size-3 rounded-full bg-primary" />
                      </span>
                    </div>
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      {t('trackingNote')}
                    </p>
                  </section>
                )}

                {/* Timeline */}
                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="mb-4 font-semibold">{t('statusTimeline')}</h2>
                  <OrderTimeline timeline={data.timeline} status={data.status} />
                </section>

                {/* Items */}
                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="mb-3 font-semibold">{t('orderItems')}</h2>
                  <ul className="flex flex-col divide-y divide-border">
                    {data.lines.map((line) => (
                      <li key={line.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <Link
                          href={`/product/${line.productId}`}
                          className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <Image
                            src={line.productImage || line.product?.image || '/placeholder.svg'}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/product/${line.productId}`}
                            className="line-clamp-1 font-medium hover:text-primary"
                          >
                            {lang === 'ar'
                              ? (line.product?.nameAr ?? line.productName)
                              : (line.product?.nameEn ?? line.productName)}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {line.qty} × {formatPrice(line.unitPrice)}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {formatPrice(line.unitPrice * line.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Summary sidebar */}
              <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold">
                    <MapPin className="size-4 text-primary" />
                    {t('deliverTo')}
                  </h2>
                  <p className="font-medium">{data.address.label}</p>
                  <p className="text-sm text-muted-foreground">{data.address.line1}</p>
                  <p className="text-sm text-muted-foreground">{data.address.city}</p>
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {data.address.phone}
                  </p>
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">{t('deliverySlot')}</p>
                    <p className="font-medium">
                      {lang === 'ar' ? data.deliverySlotAr : data.deliverySlotEn}
                    </p>
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-4">
                  <h2 className="mb-3 font-semibold">{t('orderSummary')}</h2>
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">{t('subtotal')}</dt>
                      <dd className="tabular-nums">{formatPrice(data.subtotalUsd)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">{t('shipping')}</dt>
                      <dd className="tabular-nums">
                        {data.shippingUsd === 0 ? t('free') : formatPrice(data.shippingUsd)}
                      </dd>
                    </div>
                    {(data.savingsUsd ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-primary">
                        <dt>{t('marketSavings')}</dt>
                        <dd className="tabular-nums">−{formatPrice(data.savingsUsd)}</dd>
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                      <dt>{t('total')}</dt>
                      <dd className="tabular-nums">{formatPrice(data.totalUsd)}</dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          </div>
          )
        }}
      </AsyncContent>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t('cancelOrderConfirm')}
        description={t('cancelOrderConfirmDesc')}
        confirmLabel={t('cancelOrder')}
        cancelLabel={t('back')}
        destructive
        onConfirm={handleCancel}
      />
      </div>
    </PageShell>
  )
}
