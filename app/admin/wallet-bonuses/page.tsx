'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Gift, Plus, Trash2 } from 'lucide-react'
import {
  fetchWalletBonusRules,
  createWalletBonusRuleApi,
  updateWalletBonusRuleApi,
  deleteWalletBonusRuleApi,
  type WalletBonusRule,
} from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { minTopup: '', bonusType: 'percent', bonusValue: '', maxBonus: '' }

export default function AdminWalletBonusesPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<WalletBonusRule[]>('admin/wallet-bonuses', fetchWalletBonusRules)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.minTopup || !form.bonusValue) return
    setBusy(true)
    try {
      await createWalletBonusRuleApi({
        minTopup: Number(form.minTopup),
        bonusType: form.bonusType,
        bonusValue: Number(form.bonusValue),
        maxBonus: form.maxBonus ? Number(form.maxBonus) : null,
      })
      toast.success('تمت إضافة القاعدة')
      setForm(EMPTY)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(rule: WalletBonusRule) {
    try {
      await updateWalletBonusRuleApi(rule.id, { active: !rule.active })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التحديث')
    }
  }

  async function remove(id: string) {
    try {
      await deleteWalletBonusRuleApi(id)
      toast.success('تم الحذف')
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحذف')
    }
  }

  if (isLoading) return <AdminPageSkeleton />

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Gift className="size-6 text-primary" />
        قواعد بونص الشحن
      </h1>

      {/* Create */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold text-foreground">إضافة قاعدة</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input type="number" value={form.minTopup} onChange={(e) => setForm({ ...form, minTopup: e.target.value })} placeholder="أدنى شحن ($)" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <select value={form.bonusType} onChange={(e) => setForm({ ...form, bonusType: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت $</option>
          </select>
          <input type="number" value={form.bonusValue} onChange={(e) => setForm({ ...form, bonusValue: e.target.value })} placeholder="قيمة البونص" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input type="number" value={form.maxBonus} onChange={(e) => setForm({ ...form, maxBonus: e.target.value })} placeholder="سقف البونص ($)" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
        </div>
        <button type="button" onClick={create} disabled={busy || !form.minTopup || !form.bonusValue} className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">لا توجد قواعد بعد</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="flex-1 text-foreground">
                  عند شحن ${Number(r.minTopup).toFixed(0)}+ →{' '}
                  {r.bonusType === 'percent' ? `${Number(r.bonusValue)}%` : `$${Number(r.bonusValue)}`}
                  {r.maxBonus ? ` (بحد أقصى $${Number(r.maxBonus)})` : ''}
                </span>
                <button type="button" onClick={() => toggle(r)} className={r.active ? 'rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success' : 'rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground'}>
                  {r.active ? 'مفعّل' : 'معطّل'}
                </button>
                <button type="button" onClick={() => remove(r.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
