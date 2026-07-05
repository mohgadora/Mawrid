'use client'

import useSWR from 'swr'
import { BarChart2, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { fetchAdminKpi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { useI18n } from '@/lib/i18n'

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function AdminReportsPage() {
  const { formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR('admin/kpi', fetchAdminKpi)

  return (
    <div className="route-fade space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">التقارير</h1>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={4} rows={0} />}
        isEmpty={() => false}
        empty={null}
        onRetry={() => mutate()}
      >
        {({ kpi, chart }) => (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                icon={DollarSign}
                label="إيرادات الشهر"
                value={formatPrice(kpi.gmv)}
                sub={kpi.gmvGrowth !== 0 ? `${kpi.gmvGrowth > 0 ? '+' : ''}${kpi.gmvGrowth}% مقارنة بالشهر الماضي` : undefined}
              />
              <StatCard
                icon={ShoppingCart}
                label="إجمالي الطلبات"
                value={kpi.orders.toLocaleString('ar-SA')}
                sub={`${kpi.pendingOrders} معلّق`}
              />
              <StatCard
                icon={Users}
                label="المشترون"
                value={kpi.buyers.toLocaleString('ar-SA')}
              />
              <StatCard
                icon={TrendingUp}
                label="الموردون"
                value={kpi.suppliers.toLocaleString('ar-SA')}
              />
            </div>

            {/* Revenue chart */}
            {chart.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">الإيرادات الشهرية</h2>
                <div className="flex items-end gap-3 h-40">
                  {(() => {
                    const max = Math.max(...chart.map((c) => c.value), 1)
                    return chart.map((c) => (
                      <div key={c.month} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-xs text-muted-foreground">{formatPrice(c.value)}</span>
                        <div
                          className="w-full rounded-t-md bg-primary/80 min-h-[4px]"
                          style={{ height: `${Math.max((c.value / max) * 120, 4)}px` }}
                        />
                        <span className="text-xs text-muted-foreground">{c.month.slice(5)}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Summary table */}
            <div className="rounded-xl border border-border bg-card">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">ملخص المنصة</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: 'إجمالي المبيعات (الشهر الحالي)', value: formatPrice(kpi.gmv) },
                  { label: 'نمو الإيرادات', value: `${kpi.gmvGrowth > 0 ? '+' : ''}${kpi.gmvGrowth}%` },
                  { label: 'إجمالي الطلبات', value: kpi.orders },
                  { label: 'الطلبات المعلّقة', value: kpi.pendingOrders },
                  { label: 'الموافقات المعلّقة', value: kpi.pendingApprovals },
                  { label: 'التذاكر المفتوحة', value: kpi.openTickets },
                  { label: 'إجمالي المشترين', value: kpi.buyers },
                  { label: 'إجمالي الموردين', value: kpi.suppliers },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
