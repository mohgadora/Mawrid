'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { ShoppingBag, ChevronLeft, RefreshCw } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { StatusChip } from '@/components/order-status'
import { ListSkeleton } from '@/components/skeletons'
import { useI18n } from '@/lib/i18n'
import { useCart } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { getOrders } from '@/services/orders'

export function OrdersView() {
  const { t, lang, formatPrice } = useI18n()
  const { addItem } = useCart()
  const { success } = useToast()
  const { data, error, isLoading, mutate } = useSWR('orders', getOrders)

  function handleReorder(lines: { productId: string; qty: number }[]) {
    for (const line of lines) addItem(line.productId, line.qty)
    success(t('toastAddedToCart'))
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <ShoppingBag className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-balance">{t('myOrders')}</h1>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={<ListSkeleton />}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={ShoppingBag}
            title={t('noOrders')}
            description={t('noOrdersDesc')}
            actionLabel={t('startShopping')}
            actionHref="/"
          />
        }
      >
        {(orders) => (
        <ul className="flex flex-col gap-3">
          {orders.map((order, i) => {
            const preview = order.lines.slice(0, 3)
            const extra = order.lines.length - preview.length
            return (
              <li
                key={order.id}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <Link
                  href={`/orders/${order.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="flex -space-x-2 shrink-0">
                    {preview.map((line) => (
                      <span
                        key={line.productId}
                        className="relative size-11 overflow-hidden rounded-lg border-2 border-card bg-muted"
                      >
                        <Image
                          src={line.image || '/placeholder.svg'}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="flex size-11 items-center justify-center rounded-lg border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                        +{extra}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.ref}</span>
                      <StatusChip status={order.status} size="sm" />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(
                        lang === 'ar' ? 'ar-SA' : 'en-US',
                        { day: 'numeric', month: 'long', year: 'numeric' },
                      )}
                      {' · '}
                      {order.lines.length} {t('templateItems')}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5 text-end">
                    <span className="font-bold tabular-nums text-foreground">
                      {formatPrice(order.totalUsd)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleReorder(order.lines.map((l) => ({ productId: l.productId, qty: l.qty })))
                        }}
                        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={lang === 'ar' ? 'إعادة الطلب' : 'Reorder'}
                      >
                        <RefreshCw className="size-3" />
                        {lang === 'ar' ? 'إعادة' : 'Reorder'}
                      </button>
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" />
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        )}
      </AsyncContent>
      </div>
    </PageShell>
  )
}
