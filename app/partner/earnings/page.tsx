'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { TrendingUp, Wallet, Clock, DollarSign, Send, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusChip } from '@/components/order-status'

type EarningsData = {
  kpi: {
    totalGross: number
    totalCommission: number
    totalNet: number
    available: number
    paid: number
  }
  earnings: Array<{
    id: string
    orderId: string
    grossAmount: number
    commissionRate: number
    commissionAmount: number
    netEarning: number
    status: string
    createdAt: string
  }>
  withdrawals: Array<{
    id: string
    amount: number
    currency: string
    status: string
    reference: string
    bankAccount: Record<string, string> | null
    createdAt: string
  }>
}

async function fetchEarnings(): Promise<EarningsData> {
  const res = await fetch('/api/v1/partner/earnings')
  if (!res.ok) throw new Error('فشل تحميل بيانات الأرباح')
  const json = await res.json() as { data: EarningsData }
  return json.data
}

function KpiCard({ icon: Icon, label, value, color }: {
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

function WithdrawDialog({ available, onSuccess }: { available: number; onSuccess: () => void }) {
  const { success, error: toastError } = useToast()
  const { t, formatPrice } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ amount: '', bankName: '', iban: '', note: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || amount > available) {
      toastError('المبلغ غير صالح أو يتجاوز الرصيد المتاح')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/partner/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'خطأ في الإرسال')
      success('تم إرسال طلب السحب بنجاح')
      setOpen(false)
      setForm({ amount: '', bankName: '', iban: '', note: '' })
      onSuccess()
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('toastSaveFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" disabled={available <= 0}>
        <Send className="size-4 me-2" />
        {t('partnerWithdrawRequest')}
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-foreground">{t('partnerWithdrawRequest')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('partnerEarningsBalance')}: <span className="font-semibold text-success">{formatPrice(available)}</span>
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('partnerWithdrawAmount')} (SAR)</label>
            <Input
              type="number"
              min={1}
              max={available}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('partnerWithdrawBankName')}</label>
            <Input required value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('partnerWithdrawIban')}</label>
            <Input required dir="ltr" placeholder="SA0000000000000000000000" value={form.iban} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('partnerWithdrawNote')}</label>
            <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              <span className="ms-2">إرسال الطلب</span>
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'text-yellow-600 bg-yellow-50',
  approved:  'text-blue-600 bg-blue-50',
  completed: 'text-green-600 bg-green-50',
  rejected:  'text-red-600 bg-red-50',
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending:   'معلق',
    approved:  'موافق عليه',
    completed: 'مدفوع',
    rejected:  'مرفوض',
    settled:   'مسوّى',
  }
  const color = STATUS_COLORS[status] ?? 'text-muted-foreground bg-muted'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function PartnerEarningsPage() {
  const { formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR<EarningsData>('partner/earnings', fetchEarnings)

  if (isLoading) return <AdminPageSkeleton cards={4} rows={5} />
  if (error || !data) return <div className="py-16 text-center text-muted-foreground">تعذّر تحميل بيانات الأرباح</div>

  const { kpi, earnings, withdrawals } = data

  return (
    <div className="route-fade space-y-6">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={DollarSign} label="إجمالي المبيعات" value={formatPrice(kpi.totalGross)} />
        <KpiCard icon={TrendingUp} label="عمولة المنصة" value={formatPrice(kpi.totalCommission)} color="text-destructive" />
        <KpiCard icon={Wallet} label="صافي الأرباح" value={formatPrice(kpi.totalNet)} color="text-success" />
        <KpiCard icon={Clock} label="الرصيد المتاح" value={formatPrice(kpi.available)} color="text-primary" />
      </div>

      {/* Withdraw Button */}
      <div className="flex justify-end">
        <WithdrawDialog available={kpi.available} onSuccess={() => mutate()} />
      </div>

      {/* Earnings history */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <TrendingUp className="size-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">سجل الأرباح</p>
        </div>
        {earnings.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">لا توجد أرباح مسجّلة بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">رقم الطلب</th>
                  <th className="px-5 py-3 text-start font-medium">إجمالي المبيعة</th>
                  <th className="px-5 py-3 text-start font-medium">العمولة</th>
                  <th className="px-5 py-3 text-start font-medium">صافي الربح</th>
                  <th className="px-5 py-3 text-start font-medium">الحالة</th>
                  <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs">{e.orderId.slice(0, 8)}…</td>
                    <td className="px-5 py-3">{formatPrice(e.grossAmount)}</td>
                    <td className="px-5 py-3 text-destructive">
                      -{formatPrice(e.commissionAmount)}
                      <span className="ms-1 text-xs text-muted-foreground">({e.commissionRate}%)</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-success">{formatPrice(e.netEarning)}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{e.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal requests */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <Wallet className="size-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">طلبات السحب</p>
        </div>
        {withdrawals.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">لا توجد طلبات سحب</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">المبلغ</th>
                  <th className="px-5 py-3 text-start font-medium">البنك</th>
                  <th className="px-5 py-3 text-start font-medium">الحالة</th>
                  <th className="px-5 py-3 text-start font-medium">المرجع</th>
                  <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 font-semibold">{formatPrice(w.amount)}</td>
                    <td className="px-5 py-3 text-xs">{w.bankAccount?.bankName ?? '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={w.status} /></td>
                    <td className="px-5 py-3 font-mono text-xs">{w.reference || '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{w.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
