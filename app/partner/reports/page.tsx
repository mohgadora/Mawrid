'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  BarChart3,
  Package,
  TrendingUp,
  Layers,
  DollarSign,
  ShoppingCart,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── CSV helper ──────────────────────────────────────────────────────────────
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared types ─────────────────────────────────────────────────────────────
type SalesReport = {
  summary: { totalRevenue: number; totalOrders: number; totalItems: number }
  orders: Array<{
    orderRef: string
    date: string
    status: string
    items: number
    revenue: number
  }>
}

type ProductsReport = Array<{
  name: string
  sku: string
  stock: number
  totalOrders: number
  totalQty: number
  totalRevenue: number
  status: string
}>

type EarningsReport = {
  summary: { totalGross: number; commission: number; netEarnings: number }
  rows: Array<{
    date: string
    orderId: string
    gross: number
    commissionRate: number
    commissionAmount: number
    net: number
    status: string
  }>
}

type StockReport = Array<{
  name: string
  sku: string
  currentStock: number
  variantsCount: number
  status: string
}>

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${color ?? ''}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:     { label: 'نشط',      cls: 'text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' },
    inactive:   { label: 'غير نشط', cls: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
    pending:    { label: 'معلق',     cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300' },
    completed:  { label: 'مكتمل',   cls: 'text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300' },
    cancelled:  { label: 'ملغى',    cls: 'text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300' },
    settled:    { label: 'مسوّى',   cls: 'text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300' },
    out_of_stock: { label: 'نفذ',   cls: 'text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300' },
    low_stock:  { label: 'منخفض',  cls: 'text-orange-700 bg-orange-50 dark:bg-orange-950 dark:text-orange-300' },
  }
  const entry = map[status] ?? { label: status, cls: 'text-muted-foreground bg-muted' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  )
}

function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">من</label>
        <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="w-36 text-sm" dir="ltr" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">إلى</label>
        <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="w-36 text-sm" dir="ltr" />
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">{message}</p>
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-destructive">
      <AlertCircle className="size-4" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'sales' | 'products' | 'earnings' | 'stock'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'sales',    label: 'تقرير المبيعات', icon: BarChart3 },
  { id: 'products', label: 'المنتجات',       icon: Package },
  { id: 'earnings', label: 'الأرباح',        icon: TrendingUp },
  { id: 'stock',    label: 'المخزون',        icon: Layers },
]

// ─── Sales tab ────────────────────────────────────────────────────────────────
function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}

function SalesTab() {
  const { formatPrice } = useI18n()
  const { error: toastError } = useToast()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const key = from && to ? `/api/v1/partner/reports/sales?from=${from}&to=${to}` : null
  const { data, error, isLoading } = useSWR<SalesReport>(key, async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('فشل تحميل تقرير المبيعات')
    const json = await res.json() as { data: SalesReport }
    return json.data
  })

  useEffect(() => { if (error) toastError('فشل تحميل تقرير المبيعات') }, [error, toastError])

  function handleExport() {
    if (!data) return
    const headers = ['رقم الطلب', 'التاريخ', 'الحالة', 'المنتجات', 'الإيراد']
    const rows = data.orders.map((o) => [o.orderRef, o.date, o.status, o.items, o.revenue])
    downloadCSV(`sales-report-${from}-${to}.csv`, headers, rows)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <Button size="sm" variant="outline" onClick={handleExport} disabled={!data || data.orders.length === 0}>
          <Download className="size-4 me-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <AdminPageSkeleton cards={3} rows={0} />
      ) : error || !data ? (
        <ErrorState message="تعذّر تحميل تقرير المبيعات" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard icon={DollarSign} label="إجمالي الإيراد"   value={formatPrice(data.summary.totalRevenue)} color="text-success" />
            <KpiCard icon={ShoppingCart} label="عدد الطلبات"    value={String(data.summary.totalOrders)} />
            <KpiCard icon={Package} label="إجمالي المنتجات"     value={String(data.summary.totalItems)} />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="text-sm font-semibold text-foreground">تفاصيل الطلبات</p>
            </div>
            {data.orders.length === 0 ? (
              <EmptyState message="لا توجد طلبات في هذه الفترة" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-5 py-3 text-start font-medium">رقم الطلب</th>
                      <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                      <th className="px-5 py-3 text-start font-medium">الحالة</th>
                      <th className="px-5 py-3 text-end font-medium">المنتجات</th>
                      <th className="px-5 py-3 text-end font-medium">الإيراد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => (
                      <tr key={o.orderRef} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 font-mono text-xs">{o.orderRef}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{o.date.slice(0, 10)}</td>
                        <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-5 py-3 text-end">{o.items}</td>
                        <td className="px-5 py-3 text-end font-semibold">{formatPrice(o.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Products tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const { formatPrice } = useI18n()
  const { error: toastError } = useToast()

  const { data, error, isLoading } = useSWR<ProductsReport>('/api/v1/partner/reports/products', async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('فشل تحميل تقرير المنتجات')
    const json = await res.json() as { data: ProductsReport }
    return json.data
  })

  useEffect(() => { if (error) toastError('فشل تحميل تقرير المنتجات') }, [error, toastError])

  const sorted = data ? [...data].sort((a, b) => b.totalRevenue - a.totalRevenue) : []

  if (isLoading) return <AdminPageSkeleton cards={0} rows={6} />
  if (error || !data) return <ErrorState message="تعذّر تحميل تقرير المنتجات" />

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold text-foreground">أداء المنتجات</p>
      </div>
      {sorted.length === 0 ? (
        <EmptyState message="لا توجد بيانات منتجات" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start font-medium">اسم المنتج</th>
                <th className="px-5 py-3 text-start font-medium">SKU</th>
                <th className="px-5 py-3 text-end font-medium">المخزون</th>
                <th className="px-5 py-3 text-end font-medium">الطلبات</th>
                <th className="px-5 py-3 text-end font-medium">الكمية المباعة</th>
                <th className="px-5 py-3 text-end font-medium">الإيراد الكلي</th>
                <th className="px-5 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.sku} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-5 py-3 text-end">{p.stock}</td>
                  <td className="px-5 py-3 text-end">{p.totalOrders}</td>
                  <td className="px-5 py-3 text-end">{p.totalQty}</td>
                  <td className="px-5 py-3 text-end font-semibold text-success">{formatPrice(p.totalRevenue)}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Earnings tab ─────────────────────────────────────────────────────────────
function EarningsTab() {
  const { formatPrice } = useI18n()
  const { error: toastError } = useToast()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)

  const key = from && to ? `/api/v1/partner/reports/earnings?from=${from}&to=${to}` : null
  const { data, error, isLoading } = useSWR<EarningsReport>(key, async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('فشل تحميل تقرير الأرباح')
    const json = await res.json() as { data: EarningsReport }
    return json.data
  })

  useEffect(() => { if (error) toastError('فشل تحميل تقرير الأرباح') }, [error, toastError])

  return (
    <div className="space-y-5">
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      {isLoading ? (
        <AdminPageSkeleton cards={3} rows={0} />
      ) : error || !data ? (
        <ErrorState message="تعذّر تحميل تقرير الأرباح" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard icon={DollarSign}  label="إجمالي المبيعات" value={formatPrice(data.summary.totalGross)} />
            <KpiCard icon={TrendingUp}  label="العمولة"         value={formatPrice(data.summary.commission)} color="text-destructive" />
            <KpiCard icon={TrendingUp}  label="صافي الأرباح"   value={formatPrice(data.summary.netEarnings)} color="text-success" />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <p className="text-sm font-semibold text-foreground">تفاصيل الأرباح</p>
            </div>
            {data.rows.length === 0 ? (
              <EmptyState message="لا توجد أرباح في هذه الفترة" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                      <th className="px-5 py-3 text-start font-medium">رقم الطلب</th>
                      <th className="px-5 py-3 text-end font-medium">الإجمالي</th>
                      <th className="px-5 py-3 text-end font-medium">نسبة العمولة</th>
                      <th className="px-5 py-3 text-end font-medium">مبلغ العمولة</th>
                      <th className="px-5 py-3 text-end font-medium">الصافي</th>
                      <th className="px-5 py-3 text-start font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, i) => (
                      <tr key={`${r.orderId}-${i}`} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 text-xs text-muted-foreground">{r.date.slice(0, 10)}</td>
                        <td className="px-5 py-3 font-mono text-xs">{r.orderId ? `${r.orderId.slice(0, 8)}…` : '—'}</td>
                        <td className="px-5 py-3 text-end">{formatPrice(r.gross)}</td>
                        <td className="px-5 py-3 text-end text-muted-foreground">{r.commissionRate}%</td>
                        <td className="px-5 py-3 text-end text-destructive">-{formatPrice(r.commissionAmount)}</td>
                        <td className="px-5 py-3 text-end font-semibold text-success">{formatPrice(r.net)}</td>
                        <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stock tab ────────────────────────────────────────────────────────────────
function StockTab() {
  const { error: toastError } = useToast()

  const { data, error, isLoading } = useSWR<StockReport>('/api/v1/partner/reports/stock', async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('فشل تحميل تقرير المخزون')
    const json = await res.json() as { data: StockReport }
    return json.data
  })

  useEffect(() => { if (error) toastError('فشل تحميل تقرير المخزون') }, [error, toastError])

  if (isLoading) return <AdminPageSkeleton cards={0} rows={6} />
  if (error || !data) return <ErrorState message="تعذّر تحميل تقرير المخزون" />

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold text-foreground">حالة المخزون</p>
      </div>
      {data.length === 0 ? (
        <EmptyState message="لا توجد بيانات مخزون" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start font-medium">اسم المنتج</th>
                <th className="px-5 py-3 text-start font-medium">SKU</th>
                <th className="px-5 py-3 text-end font-medium">المخزون الحالي</th>
                <th className="px-5 py-3 text-end font-medium">عدد المتغيرات</th>
                <th className="px-5 py-3 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const outOfStock = p.status === 'out_of_stock' || p.currentStock === 0
                return (
                  <tr
                    key={p.sku}
                    className={`border-b border-border/50 last:border-0 ${outOfStock ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  >
                    <td className={`px-5 py-3 font-medium ${outOfStock ? 'text-destructive' : ''}`}>{p.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className={`px-5 py-3 text-end font-semibold ${outOfStock ? 'text-destructive' : ''}`}>
                      {p.currentStock}
                    </td>
                    <td className="px-5 py-3 text-end">{p.variantsCount}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status === 'out_of_stock' || p.currentStock === 0 ? 'out_of_stock' : p.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartnerReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sales')

  return (
    <div className="route-fade space-y-6" dir="rtl">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">التقارير</h1>
        <p className="text-sm text-muted-foreground">عرض وتحليل بيانات متجرك</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'sales'    && <SalesTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'earnings' && <EarningsTab />}
      {activeTab === 'stock'    && <StockTab />}
    </div>
  )
}
