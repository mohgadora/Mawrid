'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { TrendingUp, Save } from 'lucide-react'
import { getCommissionReportApi, getAdminSuppliers, setSupplierCommissionApi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/lib/toast'

type Row = Awaited<ReturnType<typeof getCommissionReportApi>>[number]

const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  settled:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reversed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending:  'معلّق',
  settled:  'محسوب',
  reversed: 'مُعاد',
}

export default function CommissionsPage() {
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('admin/commissions', getCommissionReportApi)
  const { data: suppliers, mutate: mutateSup } = useSWR('admin/suppliers', getAdminSuppliers)
  const [rates, setRates] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function saveRate(supplierId: string) {
    const rate = Number(rates[supplierId] ?? '')
    if (isNaN(rate) || rate < 0 || rate > 100) { toastError('أدخل نسبة صحيحة بين 0 و100'); return }
    setSaving(supplierId)
    try {
      await setSupplierCommissionApi(supplierId, rate)
      await mutateSup()
      success('تم حفظ نسبة العمولة')
    } catch {
      toastError('فشل حفظ نسبة العمولة')
    } finally {
      setSaving(null)
    }
  }

  const totals = (data ?? []).reduce(
    (acc, r) => ({
      gross: acc.gross + (r.grossAmount ?? 0),
      commission: acc.commission + (r.commissionAmount ?? 0),
      net: acc.net + (r.netEarning ?? 0),
    }),
    { gross: 0, commission: 0, net: 0 },
  )

  return (
    <div className="route-fade space-y-5">
      <div className="flex items-center gap-3">
        <TrendingUp className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">تقرير العمولات</h1>
      </div>

      {/* Per-supplier commission rate editors */}
      {suppliers && suppliers.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">نسب العمولة لكل مورّد</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">المورّد</th>
                  <th className="px-4 py-3 text-start font-medium">النسبة الحالية (%)</th>
                  <th className="px-4 py-3 text-start font-medium">النسبة الجديدة (%)</th>
                  <th className="px-4 py-3 text-start font-medium">حفظ</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => {
                  const current = (s as unknown as { commissionRate?: string | null }).commissionRate
                  return (
                    <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{current != null ? `${current}%` : 'افتراضي'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          value={rates[s.id] ?? ''}
                          onChange={(e) => setRates((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => saveRate(s.id)}
                          disabled={saving === s.id || rates[s.id] === undefined}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          <Save className="size-3.5" /> حفظ
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={3} rows={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={TrendingUp} title="لا توجد بيانات عمولات" />}
        onRetry={() => mutate()}
      >
        {(rows) => (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">إجمالي المبيعات</p>
                <p className="text-xl font-bold text-foreground">
                  {totals.gross.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">إجمالي العمولات</p>
                <p className="text-xl font-bold text-primary">
                  {totals.commission.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">صافي أرباح الموردين</p>
                <p className="text-xl font-bold text-foreground">
                  {totals.net.toLocaleString('ar-SA', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">المورّد</th>
                    <th className="px-4 py-3 text-start font-medium">معدل العمولة</th>
                    <th className="px-4 py-3 text-start font-medium">الطلب</th>
                    <th className="px-4 py-3 text-start font-medium">إجمالي</th>
                    <th className="px-4 py-3 text-start font-medium">العمولة</th>
                    <th className="px-4 py-3 text-start font-medium">الصافي</th>
                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                    <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{r.supplierName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.commissionRate != null ? `${r.commissionRate}%` : 'افتراضي'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.orderId?.slice(0, 8) ?? '—'}</td>
                      <td className="px-4 py-3 text-xs">{(r.grossAmount ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-xs text-primary font-medium">{(r.commissionAmount ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-xs">{(r.netEarning ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status] ?? ''}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
