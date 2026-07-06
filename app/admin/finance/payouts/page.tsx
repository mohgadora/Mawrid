'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { getPayouts } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { InboxIcon, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type Payout = Awaited<ReturnType<typeof getPayouts>>[number]

export default function PayoutsPage() {
  const { t, formatPrice, lang } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getPayouts>>>('admin/payouts', getPayouts)

  const [acting, setActing] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; payout?: Payout }>({ open: false })
  const [rejectReason, setRejectReason] = useState('')
  const [paidDialog, setPaidDialog] = useState<{ open: boolean; payout?: Payout }>({ open: false })
  const [reference, setReference] = useState('')

  const pending      = (data ?? []).filter((p) => p.status === 'pending')
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0)
  const completed    = (data ?? []).filter((p) => p.status === 'completed').length

  async function approve(id: string) {
    setActing(id)
    try {
      const res = await fetch(`/api/v1/admin/finance/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) throw new Error(await res.text())
      success('تمت الموافقة على طلب السحب')
      mutate()
    } catch { toastError('فشلت العملية') } finally { setActing(null) }
  }

  async function reject() {
    if (!rejectDialog.payout || !rejectReason.trim()) return
    setActing(rejectDialog.payout.id)
    try {
      const res = await fetch(`/api/v1/admin/finance/withdrawals/${rejectDialog.payout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      })
      if (!res.ok) throw new Error(await res.text())
      success('تم رفض طلب السحب')
      setRejectDialog({ open: false })
      setRejectReason('')
      mutate()
    } catch { toastError('فشلت العملية') } finally { setActing(null) }
  }

  async function markPaid() {
    if (!paidDialog.payout || !reference.trim()) return
    setActing(paidDialog.payout.id)
    try {
      const res = await fetch(`/api/v1/admin/finance/withdrawals/${paidDialog.payout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'paid', reference }),
      })
      if (!res.ok) throw new Error(await res.text())
      success('تم تسجيل الدفع بنجاح')
      setPaidDialog({ open: false })
      setReference('')
      mutate()
    } catch { toastError('فشلت العملية') } finally { setActing(null) }
  }

  return (
    <div className="route-fade space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">إجمالي المعلق</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{formatPrice(pendingTotal)}</p>
          <p className="text-[11px] text-muted-foreground">{pending.length} طلب معلق</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('dateLabel')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">6 {lang === 'ar' ? 'يوليو' : 'July'}</p>
          <p className="text-[11px] text-muted-foreground">2026</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('adminPayouts')}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{completed}</p>
          <p className="text-[11px] text-muted-foreground">{t('statusCompleted')}</p>
        </div>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(payouts) => (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{t('supplierName')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('amountLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('dateLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('statusLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-foreground">{p.supplier}</p>
                      {p.bankAccount && (
                        <p className="text-[10px] text-muted-foreground">{(p.bankAccount as Record<string, string>).iban ?? ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.date}</td>
                    <td className="px-4 py-3"><AdminStatusChip status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-green-600 border-green-300 hover:bg-green-50"
                              disabled={acting === p.id} onClick={() => approve(p.id)}>
                              <CheckCircle className="size-3" /> موافقة
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/5"
                              disabled={acting === p.id} onClick={() => { setRejectDialog({ open: true, payout: p }); setRejectReason('') }}>
                              <XCircle className="size-3" /> رفض
                            </Button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-blue-600 border-blue-300 hover:bg-blue-50"
                            disabled={acting === p.id} onClick={() => { setPaidDialog({ open: true, payout: p }); setReference('') }}>
                            <CreditCard className="size-3" /> تسجيل دفع
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => !o && setRejectDialog({ open: false })}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>رفض طلب السحب</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>سبب الرفض *</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="اكتب سبب الرفض..." />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false })}>إلغاء</Button>
            <Button variant="destructive" onClick={reject} disabled={!rejectReason.trim() || !!acting}>رفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paid Dialog */}
      <Dialog open={paidDialog.open} onOpenChange={(o) => !o && setPaidDialog({ open: false })}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تسجيل عملية الدفع</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>رقم المرجع / رقم التحويل *</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-123456" dir="ltr" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaidDialog({ open: false })}>إلغاء</Button>
            <Button onClick={markPaid} disabled={!reference.trim() || !!acting}>تأكيد الدفع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
