'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { DollarSign, Plus, Trash2 } from 'lucide-react'
import {
  fetchCashbackRules,
  createCashbackRuleApi,
  updateCashbackRuleApi,
  deleteCashbackRuleApi,
  type CashbackRule,
} from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { type: 'percent', value: '', maxCashback: '', minOrderAmount: '', scope: 'global', titleAr: '' }

export default function AdminCashbackPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<CashbackRule[]>('admin/cashback-rules', fetchCashbackRules)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.value) return
    setBusy(true)
    try {
      await createCashbackRuleApi({
        type: form.type,
        value: Number(form.value),
        maxCashback: form.maxCashback ? Number(form.maxCashback) : null,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        scope: form.scope,
        titleAr: form.titleAr || null,
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

  async function toggle(rule: CashbackRule) {
    try {
      await updateCashbackRuleApi(rule.id, { active: !rule.active })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التحديث')
    }
  }

  async function remove(id: string) {
    try {
      await deleteCashbackRuleApi(id)
      toast.success('تم الحذف')
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحذف')
    }
  }

  if (isLoading) return <AdminPageSkeleton />

  const SCOPE_LABEL: Record<string, string> = { global: 'عام', supplier: 'مورد', category: 'فئة', first_order: 'أول طلب' }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <DollarSign className="size-6 text-primary" />
        قواعد الاسترجاع النقدي
      </h1>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold text-foreground">إضافة قاعدة</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت $</option>
          </select>
          <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="القيمة" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input type="number" value={form.maxCashback} onChange={(e) => setForm({ ...form, maxCashback: e.target.value })} placeholder="السقف ($)" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="أدنى طلب ($)" dir="ltr" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="global">عام</option>
            <option value="first_order">أول طلب</option>
          </select>
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (اختياري)" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
        </div>
        <button type="button" onClick={create} disabled={busy || !form.value} className="mt-3 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">لا توجد قواعد بعد</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="flex-1 text-foreground">
                  {r.titleAr ? `${r.titleAr} — ` : ''}
                  استرجاع {r.type === 'percent' ? `${Number(r.value)}%` : `$${Number(r.value)}`}
                  {Number(r.minOrderAmount) > 0 ? ` (أدنى طلب $${Number(r.minOrderAmount)})` : ''}
                  {r.maxCashback ? ` (سقف $${Number(r.maxCashback)})` : ''} · {SCOPE_LABEL[r.scope] ?? r.scope}
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
