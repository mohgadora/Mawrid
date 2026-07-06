'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Wallet, Send, Loader2, X } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { useI18n } from '@/lib/i18n'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EarningsKpi = {
  kpi: {
    available: number
  }
}

type Withdrawal = {
  id: string
  amount: number
  currency: string
  status: string
  reference: string
  bankAccount: { bankName?: string; iban?: string } | null
  rejectionReason?: string | null
  note?: string | null
  createdAt: string
}

type WithdrawalsData = {
  data: Withdrawal[]
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending:   'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
  approved:  'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  completed: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  rejected:  'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  cancelled: 'text-muted-foreground bg-muted',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'معلّق',
  approved:  'موافق عليه',
  completed: 'مكتمل',
  rejected:  'مرفوض',
  cancelled: 'ملغي',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'text-muted-foreground bg-muted'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Withdraw Dialog
// ---------------------------------------------------------------------------

function WithdrawDialog({
  available,
  onSuccess,
}: {
  available: number
  onSuccess: () => void
}) {
  const { success, error: toastError } = useToast()
  const { formatPrice } = useI18n()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ amount: '', bankName: '', iban: '', note: '' })

  function close() {
    setOpen(false)
    setForm({ amount: '', bankName: '', iban: '', note: '' })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      toastError('يرجى إدخال مبلغ صحيح')
      return
    }
    if (amount > available) {
      toastError('المبلغ يتجاوز الرصيد المتاح')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/partner/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          bankName: form.bankName,
          iban: form.iban,
          note: form.note || undefined,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'فشل إرسال طلب السحب')
      success('تم إرسال طلب السحب بنجاح')
      close()
      onSuccess()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" disabled={available <= 0}>
        <Send className="size-4 me-2" />
        طلب سحب جديد
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">طلب سحب جديد</h2>
              <button
                onClick={close}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Available balance */}
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">الرصيد المتاح للسحب</p>
              <p className="mt-0.5 text-xl font-bold text-success">{formatPrice(available)}</p>
            </div>

            <form onSubmit={submit} className="space-y-4" dir="rtl">
              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="wd-amount">المبلغ (SAR) <span className="text-destructive">*</span></Label>
                <Input
                  id="wd-amount"
                  type="number"
                  min={1}
                  max={available}
                  step="0.01"
                  required
                  dir="ltr"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>

              {/* Bank Name */}
              <div className="space-y-1.5">
                <Label htmlFor="wd-bank">اسم البنك <span className="text-destructive">*</span></Label>
                <Input
                  id="wd-bank"
                  required
                  placeholder="مثال: البنك الأهلي"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                />
              </div>

              {/* IBAN */}
              <div className="space-y-1.5">
                <Label htmlFor="wd-iban">رقم الآيبان (IBAN) <span className="text-destructive">*</span></Label>
                <Input
                  id="wd-iban"
                  required
                  dir="ltr"
                  placeholder="SA0000000000000000000000"
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="wd-note">ملاحظة (اختياري)</Label>
                <Textarea
                  id="wd-note"
                  rows={2}
                  placeholder="أي ملاحظات إضافية…"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Send className="size-4" />}
                  <span className="ms-2">إرسال الطلب</span>
                </Button>
                <Button type="button" variant="outline" onClick={close} disabled={loading}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PartnerWithdrawalsPage() {
  const { formatPrice } = useI18n()
  const { error: toastError, success } = useToast()

  // Fetch available balance from earnings KPI
  const {
    data: earningsData,
    isLoading: earningsLoading,
    error: earningsError,
  } = useSWR<EarningsKpi>('/api/v1/partner/earnings', fetcher)

  // Fetch withdrawals list
  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
    mutate,
  } = useSWR<WithdrawalsData>('/api/v1/partner/withdrawals', fetcher)

  const isLoading = earningsLoading || withdrawalsLoading
  const hasError = earningsError || withdrawalsError

  if (isLoading) return <AdminPageSkeleton cards={1} rows={6} />

  if (hasError || !earningsData || !withdrawalsData) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        تعذّر تحميل بيانات طلبات السحب
      </div>
    )
  }

  const available = earningsData?.kpi?.available ?? 0
  const withdrawals: Withdrawal[] = withdrawalsData?.data ?? []

  async function cancelWithdrawal(id: string) {
    try {
      const res = await fetch(`/api/v1/partner/withdrawals/${id}/cancel`, {
        method: 'PATCH',
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'فشل إلغاء الطلب')
      success('تم إلغاء طلب السحب')
      mutate()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    }
  }

  return (
    <div className="route-fade space-y-6" dir="rtl">
      {/* Top bar: balance + action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4 text-primary" />
            <span className="text-xs font-medium">الرصيد المتاح للسحب</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-success">{formatPrice(available)}</p>
        </div>

        <WithdrawDialog available={available} onSuccess={() => mutate()} />
      </div>

      {/* Withdrawals table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <Wallet className="size-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">طلبات السحب</p>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد طلبات سحب حتى الآن</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">المبلغ</th>
                  <th className="px-5 py-3 text-start font-medium">البنك / الآيبان</th>
                  <th className="px-5 py-3 text-start font-medium">الحالة</th>
                  <th className="px-5 py-3 text-start font-medium">المرجع</th>
                  <th className="px-5 py-3 text-start font-medium">التاريخ</th>
                  <th className="px-5 py-3 text-start font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 last:border-0">
                    {/* Amount + currency */}
                    <td className="px-5 py-3 font-semibold">
                      {formatPrice(w.amount)}
                      {w.currency && w.currency !== 'SAR' && (
                        <span className="ms-1 text-xs text-muted-foreground">{w.currency}</span>
                      )}
                    </td>

                    {/* Bank / IBAN */}
                    <td className="px-5 py-3">
                      <p className="font-medium">{w.bankAccount?.bankName ?? '—'}</p>
                      {w.bankAccount?.iban && (
                        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                          {w.bankAccount.iban}
                        </p>
                      )}
                    </td>

                    {/* Status + rejection reason */}
                    <td className="px-5 py-3">
                      <StatusBadge status={w.status} />
                      {w.status === 'rejected' && w.rejectionReason && (
                        <p className="mt-1 text-xs text-destructive">{w.rejectionReason}</p>
                      )}
                    </td>

                    {/* Reference */}
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {w.reference || '—'}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {w.createdAt.slice(0, 10)}
                    </td>

                    {/* Cancel action */}
                    <td className="px-5 py-3">
                      {w.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => cancelWithdrawal(w.id)}
                        >
                          <X className="size-3 me-1" />
                          إلغاء
                        </Button>
                      )}
                    </td>
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
