'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { fetchAdminClearances, createClearanceApi, deleteClearanceApi, type ClearanceRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { titleAr: '', titleEn: '', startsAt: '', endsAt: '', products: '' }

export default function AdminClearancePage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<ClearanceRow[]>('admin/clearance', fetchAdminClearances)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.titleAr || !form.startsAt || !form.endsAt) return
    setBusy(true)
    try {
      // كل سطر: productId:نسبة
      const products = form.products.split('\n').map((line) => {
        const [productId, pct] = line.split(':').map((s) => s.trim())
        return { productId, discountPercent: Number(pct) }
      }).filter((p) => p.productId && p.discountPercent > 0)
      await createClearanceApi({
        titleAr: form.titleAr, titleEn: form.titleEn || null,
        startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(),
        products,
      })
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
    try { await deleteClearanceApi(id); toast.success('تم الحذف'); mutate() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'تعذّر الحذف') }
  }

  if (isLoading) return <AdminPageSkeleton />
  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Tag className="size-6 text-primary" />
        تصفية المخزون
      </h1>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" className={input} />
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (English)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">من<input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={input} /></label>
          <label className="text-xs text-muted-foreground">إلى<input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={input} /></label>
        </div>
        <textarea value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} placeholder={'المنتجات — كل سطر: productId:نسبة الخصم\nمثال: abc123:30'} rows={4} dir="ltr" className={input} />
        <button type="button" onClick={create} disabled={busy || !form.titleAr || !form.startsAt || !form.endsAt} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة عرض تصفية
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? <p className="text-sm text-muted-foreground">لا توجد عروض</p> : (
          <ul className="divide-y divide-border text-sm">
            {data.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="text-foreground">{c.titleAr} · {new Date(c.startsAt).toLocaleDateString('ar')} → {new Date(c.endsAt).toLocaleDateString('ar')}</span>
                <button type="button" onClick={() => remove(c.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
