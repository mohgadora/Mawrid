'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Image as ImageIcon, Plus, Trash2, Check, X, MousePointerClick, Eye } from 'lucide-react'
import { fetchAds, createAdApi, updateAdApi, deleteAdApi, type AdvertisementRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { titleAr: '', titleEn: '', type: 'banner', imageUrl: '', targetUrl: '', placement: 'home_top', priority: '0' }
const PLACEMENTS = ['home_top', 'home_middle', 'category_page', 'search_results', 'checkout']
const TYPES = ['banner', 'popup', 'product_highlight', 'category_highlight']

export default function AdminAdsPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<AdvertisementRow[]>('admin/ads', fetchAds)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!form.titleAr || !form.imageUrl) return
    setBusy(true)
    try {
      await createAdApi({
        titleAr: form.titleAr, titleEn: form.titleEn || null, type: form.type,
        imageUrl: form.imageUrl, targetUrl: form.targetUrl || null,
        placement: form.placement, priority: Number(form.priority) || 0,
      })
      toast.success('تمت إضافة الإعلان')
      setForm(EMPTY)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function patch(id: string, data: Record<string, unknown>) {
    try {
      await updateAdApi(id, data)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التحديث')
    }
  }

  async function remove(id: string) {
    try {
      await deleteAdApi(id)
      toast.success('تم الحذف')
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحذف')
    }
  }

  if (isLoading) return <AdminPageSkeleton />

  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <ImageIcon className="size-6 text-primary" />
        الإعلانات الداخلية
      </h1>

      {/* Create */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" className={input} />
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (English)" dir="ltr" className={input} />
        </div>
        <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="رابط الصورة" dir="ltr" className={input} />
        <input value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="رابط الوجهة (اختياري)" dir="ltr" className={input} />
        <div className="grid grid-cols-3 gap-2">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={input}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className={input}>
            {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} placeholder="الأولوية" dir="ltr" className={input} />
        </div>
        <button type="button" onClick={create} disabled={busy || !form.titleAr || !form.imageUrl} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Plus className="size-4" /> إضافة
        </button>
      </div>

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((ad) => (
          <div key={ad.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.titleAr} className="h-28 w-full object-cover" />
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-foreground">{ad.titleAr}</p>
                <span className={
                  ad.status === 'approved' ? 'rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success'
                  : ad.status === 'pending' ? 'rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-600'
                  : 'rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive'
                }>{ad.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{ad.placement} · {ad.type}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="size-3.5" />{ad.impressions}</span>
                <span className="flex items-center gap-1"><MousePointerClick className="size-3.5" />{ad.clicks}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ad.status !== 'approved' && (
                  <button type="button" onClick={() => patch(ad.id, { status: 'approved' })} className="flex items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-xs font-bold text-success">
                    <Check className="size-3.5" /> اعتماد
                  </button>
                )}
                {ad.status !== 'rejected' && (
                  <button type="button" onClick={() => patch(ad.id, { status: 'rejected' })} className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
                    <X className="size-3.5" /> رفض
                  </button>
                )}
                <button type="button" onClick={() => patch(ad.id, { active: !ad.active })} className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-foreground">
                  {ad.active ? 'إيقاف' : 'تفعيل'}
                </button>
                <button type="button" onClick={() => remove(ad.id)} aria-label="حذف" className="grid size-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">لا توجد إعلانات بعد</p>}
      </div>
    </div>
  )
}
