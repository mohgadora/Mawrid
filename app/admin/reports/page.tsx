'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BarChart2, TrendingUp, ShoppingCart, Users, DollarSign, Package, Store } from 'lucide-react'
import {
  getAnalyticsSummaryApi,
  getRevenueByDayApi,
  getTopProductsApi,
  getTopSuppliersApi,
  getAnalyticsKpiApi,
  type TopProducts,
  type TopSuppliers,
} from '@/lib/api-client'
import { AdminPageSkeleton } from '@/components/skeletons'

type Period = '7d' | '30d' | '90d' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d',  label: 'آخر 7 أيام' },
  { value: '30d', label: 'آخر 30 يوم' },
  { value: '90d', label: 'آخر 90 يوم' },
  { value: 'all', label: 'الكل' },
]

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 bg-primary/10 ${color}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  if (!data.length) return null
  const maxRevenue = data.reduce((m, d) => Math.max(m, d.revenue), 1)
  return (
    <div className="flex items-end gap-1 h-40 w-full overflow-x-auto">
      {data.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[20px]">
          <div
            className="w-full bg-primary/70 rounded-t transition-all"
            style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 140)}px` }}
            title={`${d.date}: ${d.revenue.toLocaleString('ar-SA')} ر.س`}
          />
          <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: kpi, isLoading: kpiLoading } = useSWR('admin/analytics/kpi', getAnalyticsKpiApi)
  const { data: summary, isLoading: summaryLoading } = useSWR(['admin/analytics/summary', period], () => getAnalyticsSummaryApi(period))
  const { data: revenueByDay, isLoading: chartLoading } = useSWR(['admin/analytics/revenue-by-day', period], () => getRevenueByDayApi(period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365))
  const { data: topProducts } = useSWR('admin/analytics/top-products', getTopProductsApi)
  const { data: topSuppliers } = useSWR('admin/analytics/top-suppliers', getTopSuppliersApi)

  const isLoading = kpiLoading || summaryLoading || chartLoading

  return (
    <div className="route-fade space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">التقارير والإحصاءات</h1>
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="إجمالي الإيرادات" value={`${(summary?.totalRevenue ?? 0).toLocaleString('ar-SA')} ر.س`} sub={summary?.changePercent != null ? `${summary.changePercent > 0 ? '+' : ''}${summary.changePercent.toFixed(1)}% مقارنة بالفترة السابقة` : undefined} />
        <StatCard icon={ShoppingCart} label="عدد الطلبات" value={(summary?.orderCount ?? 0).toLocaleString('ar-SA')} />
        <StatCard icon={TrendingUp} label="متوسط قيمة الطلب" value={`${(summary?.avgOrderValue ?? 0).toLocaleString('ar-SA')} ر.س`} />
        <StatCard icon={Users} label="إجمالي المستخدمين" value={(kpi?.totalUsers ?? 0).toLocaleString('ar-SA')} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="منتجات نشطة" value={(kpi?.activeProducts ?? 0).toLocaleString('ar-SA')} color="text-green-600" />
        <StatCard icon={Store} label="الموردون" value={(kpi?.totalSuppliers ?? 0).toLocaleString('ar-SA')} />
        <StatCard icon={Package} label="بانتظار الموافقة" value={(kpi?.pendingApprovals ?? 0).toLocaleString('ar-SA')} color="text-yellow-600" />
        <StatCard icon={DollarSign} label="طلبات سحب معلّقة" value={(kpi?.pendingWithdrawals ?? 0).toLocaleString('ar-SA')} color="text-orange-600" />
      </div>

      {/* Revenue chart */}
      {isLoading ? (
        <AdminPageSkeleton cards={0} rows={4} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">الإيرادات اليومية</p>
          {revenueByDay && revenueByDay.length > 0 ? (
            <BarChart data={revenueByDay} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات للفترة المحددة</p>
          )}
        </div>
      )}

      {/* Top products + suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">أفضل المنتجات مبيعاً</p>
          </div>
          <div className="divide-y divide-border/50">
            {(topProducts ?? ([] as TopProducts)).slice(0, 8).map((p, i) => (
              <div key={p.productId ?? i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                <div className="size-8 rounded overflow-hidden bg-muted shrink-0 grid place-items-center">
                  {p.image
                    ? <img src={p.image} alt="" className="size-8 object-cover" />
                    : <Package className="size-3.5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.totalQty} وحدة</p>
                </div>
                <p className="text-xs font-semibold text-primary shrink-0">{p.totalRevenue.toLocaleString('ar-SA')} ر.س</p>
              </div>
            ))}
            {!topProducts?.length && <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">أفضل الموردين</p>
          </div>
          <div className="divide-y divide-border/50">
            {(topSuppliers ?? ([] as TopSuppliers)).slice(0, 8).map((s, i) => (
              <div key={s.supplierId ?? i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">{s.orderCount} طلب</p>
                </div>
                <p className="text-xs font-semibold text-primary shrink-0">{s.totalRevenue.toLocaleString('ar-SA')} ر.س</p>
              </div>
            ))}
            {!topSuppliers?.length && <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
