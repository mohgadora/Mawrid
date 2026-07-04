'use client'

import {
  Clock,
  CheckCircle2,
  Loader,
  PackageCheck,
  Truck,
  Bike,
  Home,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useI18n, type DictKey } from '@/lib/i18n'
import { ORDER_FLOW, type OrderEvent, type OrderStatus } from '@/services/orders'
import { cn } from '@/lib/utils'

type Meta = { dictKey: DictKey; chip: string; dot: string; icon: LucideIcon }

const STATUS_META: Record<OrderStatus, Meta> = {
  pending: { dictKey: 'statusPending', chip: 'bg-chart-3/15 text-chart-3', dot: 'bg-chart-3', icon: Clock },
  confirmed: { dictKey: 'statusConfirmed', chip: 'bg-chart-4/15 text-chart-4', dot: 'bg-chart-4', icon: CheckCircle2 },
  processing: { dictKey: 'statusProcessing', chip: 'bg-chart-3/15 text-chart-3', dot: 'bg-chart-3', icon: Loader },
  packed: { dictKey: 'statusPacked', chip: 'bg-chart-4/15 text-chart-4', dot: 'bg-chart-4', icon: PackageCheck },
  shipped: { dictKey: 'statusShipped', chip: 'bg-primary/15 text-primary', dot: 'bg-primary', icon: Truck },
  out_for_delivery: { dictKey: 'statusOutForDelivery', chip: 'bg-primary/15 text-primary', dot: 'bg-primary', icon: Bike },
  delivered: { dictKey: 'statusDelivered', chip: 'bg-success/15 text-success', dot: 'bg-success', icon: Home },
  cancelled: { dictKey: 'statusCancelled', chip: 'bg-destructive/15 text-destructive', dot: 'bg-destructive', icon: XCircle },
}

export function StatusChip({ status, size = 'md' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const { t } = useI18n()
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        meta.chip,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      {t(meta.dictKey)}
    </span>
  )
}

/** Rich visual order tracking timeline — horizontal stepper on desktop, vertical on mobile. */
export function OrderTimeline({
  timeline,
  status,
}: {
  timeline: OrderEvent[]
  status: OrderStatus
}) {
  const { t, lang } = useI18n()
  const completed = new Set(timeline.map((e) => e.status))
  const cancelled = status === 'cancelled'
  const steps: OrderStatus[] = cancelled ? ['pending', 'cancelled'] : ORDER_FLOW
  const currentIdx = steps.indexOf(status)

  function fmtDate(iso: string) {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  }

  function eventAt(s: OrderStatus): string | null {
    const event = timeline.find((e) => e.status === s)
    return event ? fmtDate(event.at) : null
  }

  // Estimated delivery: 2 days from last event or creation
  const lastEvent = timeline[timeline.length - 1]
  const estimatedDelivery = (() => {
    if (status === 'delivered' || status === 'cancelled') return null
    const base = lastEvent ? new Date(lastEvent.at) : new Date()
    const d = new Date(base)
    d.setDate(d.getDate() + 2)
    return fmtDate(d.toISOString())
  })()

  // Courier tracking number (mock)
  const trackingNo = `MW${timeline[0]?.at.slice(0, 10).replace(/-/g, '')}${status !== 'pending' ? '7834' : ''}`
  const showCourier = status === 'shipped' || status === 'out_for_delivery'

  return (
    <div className="flex flex-col gap-5">
      {/* Estimated delivery banner */}
      {estimatedDelivery && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/8 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Truck className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'التوصيل المتوقع' : 'Estimated Delivery'}
            </p>
            <p className="font-bold text-foreground">{estimatedDelivery}</p>
          </div>
          {status === 'out_for_delivery' && (
            <span className="ms-auto flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/70" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
              </span>
              {lang === 'ar' ? 'في الطريق إليك' : 'On the way'}
            </span>
          )}
        </div>
      )}

      {/* Courier card */}
      {showCourier && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Bike className="size-4 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'شركة الشحن' : 'Carrier'}
            </p>
            <p className="truncate font-semibold text-foreground">
              {lang === 'ar' ? 'شركة مورد للتوصيل' : 'Mawrid Express'}
            </p>
          </div>
          <div className="text-end shrink-0">
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'رقم التتبع' : 'Tracking no.'}
            </p>
            <p className="font-mono text-xs font-bold text-primary tabular-nums">{trackingNo}</p>
          </div>
        </div>
      )}

      {/* Horizontal stepper — desktop */}
      <ol className="hidden sm:flex items-start" aria-label="Order progress">
        {steps.map((s, i) => {
          const meta = STATUS_META[s]
          const Icon = meta.icon
          const done = completed.has(s)
          const isCurrent = s === status
          const isLast = i === steps.length - 1
          const progressPct = isLast ? 100 : done && completed.has(steps[i + 1]) ? 100 : isCurrent ? 50 : 0

          return (
            <li key={s} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Left connector */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i === 0 ? 'invisible' : done ? 'bg-primary' : 'bg-border',
                  )}
                />
                {/* Step dot */}
                <span className="relative flex shrink-0 items-center justify-center">
                  {isCurrent && !cancelled && (
                    <span
                      className={cn(
                        'absolute size-10 animate-ping rounded-full opacity-40',
                        meta.dot,
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      'relative grid size-10 place-items-center rounded-full border-2 transition-all duration-300',
                      done
                        ? `${meta.dot} border-transparent text-primary-foreground`
                        : isCurrent
                          ? `border-primary bg-card text-primary`
                          : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </span>
                {/* Right connector */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    isLast ? 'invisible' : progressPct === 100 ? 'bg-primary' : 'bg-border',
                  )}
                />
              </div>
              {/* Label below dot */}
              <div className="mt-2 w-full px-1 text-center">
                <p
                  className={cn(
                    'text-[11px] font-bold leading-tight',
                    done ? 'text-foreground' : 'text-muted-foreground',
                    isCurrent && 'text-primary',
                  )}
                >
                  {t(meta.dictKey)}
                </p>
                {eventAt(s) && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums leading-tight">
                    {eventAt(s)}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Vertical timeline — mobile */}
      <ol className="flex sm:hidden flex-col gap-0">
        {steps.map((s, i) => {
          const meta = STATUS_META[s]
          const Icon = meta.icon
          const done = completed.has(s)
          const isCurrent = s === status
          const isLast = i === steps.length - 1
          return (
            <li key={s} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="relative grid place-items-center">
                  {isCurrent && !cancelled && (
                    <span
                      className={cn('absolute size-9 animate-ping rounded-full opacity-40', meta.dot)}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      'relative grid size-9 place-items-center rounded-full border-2 transition-colors',
                      done
                        ? `${meta.dot} border-transparent text-primary-foreground`
                        : isCurrent
                          ? 'border-primary bg-card text-primary'
                          : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </span>
                {!isLast && (
                  <span
                    className={cn('w-0.5 flex-1', done ? meta.dot : 'bg-border')}
                    style={{ minBlockSize: '1.75rem' }}
                  />
                )}
              </div>
              <div className={cn('pb-5', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm font-bold',
                    done ? 'text-foreground' : 'text-muted-foreground',
                    isCurrent && 'text-primary',
                  )}
                >
                  {t(meta.dictKey)}
                </p>
                {eventAt(s) && (
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{eventAt(s)}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Delivery confirmation */}
      {status === 'delivered' && (
        <div className="flex items-center gap-2.5 rounded-xl bg-success/10 px-4 py-3 text-success">
          <Home className="size-4 shrink-0" />
          <p className="text-sm font-semibold">
            {lang === 'ar'
              ? `تم التسليم بتاريخ ${eventAt('delivered') ?? ''}`
              : `Delivered on ${eventAt('delivered') ?? ''}`}
          </p>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-destructive">
          <XCircle className="size-4 shrink-0" />
          <p className="text-sm font-semibold">
            {lang === 'ar' ? 'تم إلغاء الطلب' : 'Order has been cancelled'}
          </p>
        </div>
      )}
    </div>
  )
}
