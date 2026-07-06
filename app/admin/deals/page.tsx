'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { fetchAdminDeals, createDealApi, deleteDealApi, type DealRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { productId: '', titleAr: '', titleEn: '', discountType: 'percent', discount: '', date: new Date().toISOString().slice(0, 10) }

export default function AdminDealsPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<DealRow[]>('admin/deals', fetchAdminDeals)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.productId || !form.titleAr || !form.discount) return
    setBusy(true)
    try {
      await createDealApi({ ...form, discount: Number(form.discount) })
      toast.success('تمت الإضافة')
      setForm(EMPTY)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    try { await deleteDealApi(id); toast.success('تم الحذف'); mutate() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'تعذّر الحذف') }
  }

  if (isLoading) return <AdminPageSkeleton />
  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Megaphone className="size-6 text-primary" />
        عرض اليوم
      </h1>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="معرّف المنتج (productId)" dir="ltr" className={input} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" className={input} />
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (English)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={input}>
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت $</option>
          </select>
          <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="الخصم" dir="ltr" className={input} />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
        </div>
        <button type="button" onClick={create} disabled={busy || !form.productId || !form.titleAr || !form.discount} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? <p className="text-sm text-muted-foreground">لا توجد عروض</p> : (
          <ul className="divide-y divide-border text-sm">
            {data.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span className="text-foreground">{d.titleAr} · {d.date} · {d.discountType === 'percent' ? `${Number(d.discount)}%` : `$${Number(d.discount)}`}</span>
                <button type="button" onClick={() => remove(d.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
