'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { InboxIcon, Coins } from 'lucide-react'
import { getAdminLoyaltyApi, adjustLoyaltyApi, type AdminLoyaltyData } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ── Summary card ─────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('ar-SA')}</p>
    </div>
  )
}

// ── Adjust dialog ─────────────────────────────────────────────────────────

type AdjustTarget = { userId: string; userName: string; balance: number }

function AdjustDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: AdjustTarget
  onClose: () => void
  onSuccess: () => void
}) {
  const [delta, setDelta] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    const d = parseInt(delta, 10)
    if (!d || d === 0) { setError('أدخل قيمة غير صفرية'); return }
    if (!note.trim()) { setError('الملاحظة مطلوبة'); return }

    setLoading(true)
    try {
      await adjustLoyaltyApi(target.userId, d, note.trim())
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل نقاط — {target.userName}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          الرصيد الحالي: <strong>{target.balance.toLocaleString('ar-SA')} نقطة</strong>
        </p>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="delta">التعديل (موجب للإضافة، سالب للخصم)</Label>
            <Input
              id="delta"
              type="number"
              placeholder="مثال: 100 أو -50"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">الملاحظة</Label>
            <Input
              id="note"
              placeholder="سبب التعديل"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button variant="outline" onClick={onClose} disabled={loading}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'جارٍ الحفظ…' : 'تأكيد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { data, error, isLoading, mutate } = useSWR<AdminLoyaltyData>(
    'admin/loyalty',
    getAdminLoyaltyApi,
  )

  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null)

  return (
    <div className="space-y-6 route-fade" dir="rtl">
      <h1 className="text-xl font-bold">نقاط الولاء</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="إجمالي الحسابات"    value={data?.summary.totalAccounts  ?? 0} />
        <SummaryCard label="مجموع الأرصدة"       value={data?.summary.totalBalance   ?? 0} />
        <SummaryCard label="إجمالي النقاط المكتسبة"  value={data?.summary.totalEarned    ?? 0} />
        <SummaryCard label="إجمالي النقاط المستردة" value={data?.summary.totalRedeemed  ?? 0} />
      </div>

      {/* Accounts table */}
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.accounts.length === 0}
        empty={<EmptyState icon={Coins} title="لا توجد حسابات ولاء بعد" />}
        onRetry={() => mutate()}
      >
        {(d) => (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-start font-medium">المستخدم</th>
                    <th className="px-5 py-3 text-start font-medium">البريد الإلكتروني</th>
                    <th className="px-5 py-3 text-start font-medium">الرصيد</th>
                    <th className="px-5 py-3 text-start font-medium">مكتسب</th>
                    <th className="px-5 py-3 text-start font-medium">مستخدم</th>
                    <th className="px-5 py-3 text-start font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {d.accounts.map((acct) => (
                    <tr
                      key={acct.id}
                      className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 text-xs font-semibold">{acct.userName}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{acct.userEmail}</td>
                      <td className="px-5 py-3 text-xs font-bold tabular-nums">
                        {acct.balance.toLocaleString('ar-SA')}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{acct.lifetimeEarned.toLocaleString('ar-SA')}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums text-rose-600 dark:text-rose-400">
                        -{acct.lifetimeRedeemed.toLocaleString('ar-SA')}
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            setAdjustTarget({
                              userId:   acct.userId,
                              userName: acct.userName,
                              balance:  acct.balance,
                            })
                          }
                        >
                          تعديل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>

      {adjustTarget && (
        <AdjustDialog
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  )
}
