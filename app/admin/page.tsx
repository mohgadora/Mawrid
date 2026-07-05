'use client'

import useSWR from 'swr'
import Link from 'next/link'
import {
  TrendingUp, ShoppingCart, Store, Users, ClipboardCheck,
  Headphones, DollarSign, Package, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { getAdminKpi, getApprovals, getAdminOrders, getAdminSuppliers, getSupportTickets, getAnalyticsKpiApi } from '@/lib/api-client'
import { StatusChip } from '@/components/order-status'
import { AdminPageSkeleton } from '@/components/skeletons'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { InboxIcon } from 'lucide-react'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} م`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} ك`
  return n.toLocaleString('ar-SA')
}

const ORDER_STATUS_DATA = [
  { labelKey: 'statusDelivered', count: 5820, color: '#22c55e' },
  { labelKey: 'statusShipped', count: 2140, color: '#a855f7' },
  { labelKey: 'statusConfirmed', count: 1890, color: '#3b82f6' },
  { labelKey: 'statusPending', count: 2190, color: '#eab308' },
  { labelKey: 'statusCancelled', count: 500, color: '#ef4444' },
] as const

const ORDER_TOTAL = ORDER_STATUS_DATA.reduce((a, b) => a + b.count, 0)

function DonutChart() {
  const radius = 54
  const cx = 64; const cy = 64
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const segments = ORDER_STATUS_DATA.map((d) => {
    const pct = d.count / ORDER_TOTAL
    const dash = pct * circumference
    const seg = { ...d, dash, offset, pct }
    offset += dash
    return seg
  })
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="16" />
        {segments.map((s) => (
          <circle key={s.labelKey} cx={cx} cy={cy} r={radius} fill="none" stroke={s.color}
            strokeWidth="16"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 64 64)"
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="currentColor" style={{ fontSize: 18, fontWeight: 700 }}>
          {fmt(ORDER_TOTAL)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="currentColor" style={{ fontSize: 9, opacity: 0.6 }}>
          طلب
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 w-full">
        {segments.map((d) => (
          <div key={d.labelKey} className="flex items-center gap-1.5">
            <div className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="text-[11px] text-muted-foreground">{d.labelKey}</span>
            <span className="text-[11px] font-semibold text-foreground ms-auto">{((d.count / ORDER_TOTAL) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t, formatPrice } = useI18n()
  const kpiSwr         = useSWR<Awaited<ReturnType<typeof getAdminKpi>>>('admin/kpi',       getAdminKpi)
  const analyticsKpiSwr = useSWR('admin/analytics/kpi', getAnalyticsKpiApi)
  const approvalSwr = useSWR<Awaited<ReturnType<typeof getApprovals>>>('admin/approvals',  getApprovals)
  const orderSwr    = useSWR<Awaited<ReturnType<typeof getAdminOrders>>>('admin/orders',     getAdminOrders)
  const supplierSwr = useSWR<Awaited<ReturnType<typeof getAdminSuppliers>>>('admin/suppliers',  getAdminSuppliers)
  const ticketSwr   = useSWR<Awaited<ReturnType<typeof getSupportTickets>>>('admin/tickets',    getSupportTickets)

  const kpi    = kpiSwr.data?.kpi
  const chart  = kpiSwr.data?.chart ?? []
  const maxVal = chart.length ? Math.max(...chart.map((r) => r.value)) : 1

  const pendingApprovals = (approvalSwr.data ?? []).filter((a) => a.status === 'pending')
  const topSuppliers     = (supplierSwr.data ?? []).filter((s) => s.status === 'active').sort((a, b) => b.orders - a.orders).slice(0, 4)
  const urgentTickets    = (ticketSwr.data   ?? []).filter((tk) => tk.priority === 'urgent' || tk.priority === 'high').slice(0, 3)

  if (kpiSwr.isLoading && !kpiSwr.data) return <AdminPageSkeleton cards={8} rows={5} />

  const KPIS = !kpi ? [] : [
    { labelKey: 'kpiGmv' as const,             value: formatPrice(kpi.gmv),         growth: kpi.gmvGrowth,        icon: TrendingUp,     href: '/admin/finance/transactions' },
    { labelKey: 'kpiOrders' as const,           value: fmt(kpi.orders),              growth: kpi.ordersGrowth,     icon: ShoppingCart,   href: '/admin/orders' },
    { labelKey: 'kpiSuppliers' as const,        value: String(kpi.suppliers),        growth: kpi.suppliersGrowth,  icon: Store,          href: '/admin/suppliers' },
    { labelKey: 'kpiBuyers' as const,           value: fmt(kpi.buyers),              growth: kpi.buyersGrowth,     icon: Users,          href: '/admin/buyers' },
    { labelKey: 'kpiRevenue' as const,          value: formatPrice(kpi.revenue),     growth: kpi.revenueGrowth,    icon: DollarSign,     href: '/admin/finance/payouts' },
    { labelKey: 'kpiPendingApprovals' as const, value: String(kpi.pendingApprovals), growth: undefined as number | undefined, icon: ClipboardCheck, href: '/admin/approvals' },
    { labelKey: 'kpiOpenTickets' as const,      value: String(kpi.openTickets),      growth: undefined as number | undefined, icon: Headphones,     href: '/admin/support/tickets' },
    { labelKey: 'adminBrands' as const,         value: analyticsKpiSwr.data ? String(analyticsKpiSwr.data.totalProducts) : '—', growth: undefined as number | undefined, icon: Package,        href: '/admin/brands' },
  ]

  return (
    <div className="space-y-6 route-fade">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map(({ labelKey, value, growth, icon: Icon, href }) => (
          <Link
            key={labelKey}
            href={href}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground">{t(labelKey)}</p>
                <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
                {growth != null && (
                  <div className={`mt-1 flex items-center gap-0.5 text-[11px] font-medium ${(growth as number) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    {(growth as number) >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(growth as number)}% {t('vsLastMonth')}
                  </div>
                )}
              </div>
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue bar chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('kpiRevenue')}</p>
            <span className="text-xs text-muted-foreground">6 {t('daysAgo')}</span>
          </div>
          {chart.length > 0 ? (
            <div className="flex h-44 items-end gap-3">
              {chart.map((r) => {
                const pct = (r.value / maxVal) * 100
                return (
                  <div key={r.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-primary">{(r.value / 1000).toFixed(0)}ك</span>
                    <div
                      className="w-full min-h-1 rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{r.month}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">{t('noData')}</div>
          )}
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">{t('adminOrders')}</p>
          <DonutChart />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending approvals */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('approvalsTitle')}</p>
            <Link href="/admin/approvals" className="text-xs font-medium text-primary hover:underline">
              {t('browseAll')} ({pendingApprovals.length})
            </Link>
          </div>
          <ul className="space-y-2">
            {pendingApprovals.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {a.id.slice(-2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{a.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{a.subtitle}</p>
                </div>
                <span className={`mt-0.5 shrink-0 text-[10px] font-semibold ${
                  a.priority === 'high' ? 'text-destructive' : a.priority === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
                }`}>
                  {a.priority === 'high' ? t('priorityHigh') : a.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top suppliers */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('adminSuppliers')}</p>
            <Link href="/admin/suppliers" className="text-xs font-medium text-primary hover:underline">{t('browseAll')}</Link>
          </div>
          <ul className="space-y-3">
            {topSuppliers.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.orders.toLocaleString('ar-SA')} {t('supplierOrders')} — {s.category}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-primary">{s.rating} ★</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Urgent tickets */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('adminTickets')}</p>
            <Link href="/admin/support/tickets" className="text-xs font-medium text-primary hover:underline">{t('browseAll')}</Link>
          </div>
          <ul className="space-y-2">
            {urgentTickets.map((tk) => (
              <li key={tk.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground leading-snug">{tk.subject}</p>
                  <StatusChip status={tk.priority === 'urgent' ? 'pending' : 'processing'} size="sm" />
                </div>
                <p className="text-[10px] text-muted-foreground">{tk.user} · {tk.created.split(' ')[0]}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-foreground">{t('adminOrders')}</p>
          <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">{t('browseAll')}</Link>
        </div>
        <AsyncContent
          data={orderSwr.data}
          error={orderSwr.error}
          isLoading={orderSwr.isLoading}
          loading={<AdminPageSkeleton cards={0} rows={5} />}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon={InboxIcon} title={t('noData')} className="border-0 py-10" />}
          onRetry={() => orderSwr.mutate()}
        >
          {(orders) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 text-start font-medium">{t('orderId')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('buyerLabel')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('supplierLabel')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('itemsLabel')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('amountLabel')}</th>
                    <th className="px-5 py-2.5 text-start font-medium">{t('statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">{o.id}</td>
                      <td className="px-5 py-3 text-xs text-foreground">{o.buyer}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{o.supplier}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{o.items}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">{formatPrice(o.amount)}</td>
                      <td className="px-5 py-3"><StatusChip status={o.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncContent>
      </div>
    </div>
  )
}
