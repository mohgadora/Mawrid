'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Star, Plus, Trash2 } from 'lucide-react'
import {
  fetchAllSubscriptionPlans,
  createSubscriptionPlanApi,
  updateSubscriptionPlanApi,
  deleteSubscriptionPlanApi,
  fetchStoreSubscriptions,
  type SubscriptionPlanRow,
} from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = {
  nameAr: '', nameEn: '', priceMonthly: '', priceYearly: '', maxProducts: '', maxOrders: '', commissionRate: '', features: '',
}

export default function AdminSubscriptionPlansPage() {
  const toast = useToast()
  const plansSWR = useSWR<SubscriptionPlanRow[]>('admin/subscription-plans', fetchAllSubscriptionPlans)
  const subsSWR = useSWR('admin/store-subscriptions', fetchStoreSubscriptions)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.nameAr || !form.priceMonthly) return
    setBusy(true)
    try {
      await createSubscriptionPlanApi({
        nameAr: form.nameAr, nameEn: form.nameEn || null,
        priceMonthly: Number(form.priceMonthly),
        priceYearly: form.priceYearly ? Number(form.priceYearly) : null,
        maxProducts: form.maxProducts ? Number(form.maxProducts) : null,
        maxOrders: form.maxOrders ? Number(form.maxOrders) : null,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
        features: form.features ? form.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
      })
      toast.success('تمت إضافة الباقة')
      setForm(EMPTY)
      plansSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(plan: SubscriptionPlanRow) {
    try {
      await updateSubscriptionPlanApi(plan.id, { active: !plan.active })
      plansSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التحديث')
    }
  }

  async function remove(id: string) {
    try {
      await deleteSubscriptionPlanApi(id)
      toast.success('تم الحذف')
      plansSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحذف')
    }
  }

  if (plansSWR.isLoading) return <AdminPageSkeleton />

  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Star className="size-6 text-primary" />
        باقات الاشتراك
      </h1>

      {/* Create */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="اسم الباقة (عربي)" className={input} />
          <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Name (English)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} placeholder="سعر شهري ($)" dir="ltr" className={input} />
          <input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: e.target.value })} placeholder="سعر سنوي ($)" dir="ltr" className={input} />
          <input type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} placeholder="عمولة %" dir="ltr" className={input} />
          <input type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: e.target.value })} placeholder="حد المنتجات" dir="ltr" className={input} />
          <input type="number" value={form.maxOrders} onChange={(e) => setForm({ ...form, maxOrders: e.target.value })} placeholder="حد الطلبات/شهر" dir="ltr" className={input} />
        </div>
        <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="الميزات (مفصولة بفواصل)" className={input} />
        <button type="button" onClick={create} disabled={busy || !form.nameAr || !form.priceMonthly} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة باقة
        </button>
      </div>

      {/* Plans */}
      <div className="grid gap-3 md:grid-cols-3">
        {(plansSWR.data ?? []).map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground">{plan.nameAr}</p>
              <button type="button" onClick={() => remove(plan.id)} aria-label="حذف" className="grid size-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-lg font-black text-primary">${Number(plan.priceMonthly).toFixed(0)}/شهر</p>
            <p className="text-xs text-muted-foreground">
              {plan.commissionRate != null ? `عمولة ${Number(plan.commissionRate)}% · ` : ''}
              {plan.maxProducts != null ? `${plan.maxProducts} منتج` : 'منتجات غير محدودة'}
            </p>
            <button type="button" onClick={() => toggle(plan)} className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${plan.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
              {plan.active ? 'مفعّلة' : 'معطّلة'}
            </button>
          </div>
        ))}
        {!plansSWR.data?.length && <p className="text-sm text-muted-foreground">لا توجد باقات بعد</p>}
      </div>

      {/* Active subscriptions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold text-foreground">اشتراكات المتاجر</h2>
        {!subsSWR.data?.length ? (
          <p className="text-sm text-muted-foreground">لا توجد اشتراكات</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {subsSWR.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="text-foreground">{s.supplierName} — {s.planName}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={s.status === 'active' ? 'font-bold text-success' : 'text-muted-foreground'}>{s.status}</span>
                  <span dir="ltr">{new Date(s.currentPeriodEnd).toLocaleDateString('ar')}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
