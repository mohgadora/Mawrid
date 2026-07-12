'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Globe, Save, Trash2 } from 'lucide-react'
import { fetchSeoMeta, upsertSeoMetaApi, deleteSeoMetaApi, type SeoMetaRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = {
  entityType: 'product', entityId: '', titleAr: '', titleEn: '',
  descriptionAr: '', descriptionEn: '', keywords: '', ogImage: '', canonicalUrl: '', noIndex: false,
}

export default function AdminSeoPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<SeoMetaRow[]>('admin/seo', () => fetchSeoMeta())
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!form.entityId.trim()) return
    setBusy(true)
    try {
      await upsertSeoMetaApi({
        entityType: form.entityType,
        entityId: form.entityId.trim(),
        titleAr: form.titleAr || null,
        titleEn: form.titleEn || null,
        descriptionAr: form.descriptionAr || null,
        descriptionEn: form.descriptionEn || null,
        keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        ogImage: form.ogImage || null,
        canonicalUrl: form.canonicalUrl || null,
        noIndex: form.noIndex,
      })
      toast.success('تم الحفظ')
      setForm(EMPTY)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function edit(row: SeoMetaRow) {
    setForm({
      entityType: row.entityType, entityId: row.entityId,
      titleAr: row.titleAr ?? '', titleEn: row.titleEn ?? '',
      descriptionAr: row.descriptionAr ?? '', descriptionEn: row.descriptionEn ?? '',
      keywords: (row.keywords ?? []).join(', '),
      ogImage: row.ogImage ?? '', canonicalUrl: row.canonicalUrl ?? '', noIndex: row.noIndex,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: string) {
    try {
      await deleteSeoMetaApi(id)
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
        <Globe className="size-6 text-primary" />
        تحسين محركات البحث (SEO)
      </h1>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })} className={input}>
            <option value="product">منتج</option>
            <option value="category">فئة</option>
            <option value="supplier">مورد</option>
            <option value="page">صفحة</option>
          </select>
          <input value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} placeholder="معرّف الكيان (ID أو slug)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" className={input} />
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (English)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} placeholder="الوصف (عربي)" rows={2} className={input} />
          <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Description (English)" dir="ltr" rows={2} className={input} />
        </div>
        <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="الكلمات المفتاحية (مفصولة بفواصل)" className={input} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} placeholder="صورة OG (رابط)" dir="ltr" className={input} />
          <input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="Canonical URL" dir="ltr" className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={form.noIndex} onChange={(e) => setForm({ ...form, noIndex: e.target.checked })} />
          منع الفهرسة (noindex)
        </label>
        <button type="button" onClick={save} disabled={busy || !form.entityId.trim()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Save className="size-4" /> حفظ
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? (
          <p className="text-sm text-muted-foreground">لا توجد تجاوزات بعد</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <button type="button" onClick={() => edit(row)} className="flex-1 text-start">
                  <span className="font-semibold text-foreground">{row.titleAr || row.titleEn || row.entityId}</span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">{row.entityType} · {row.entityId}{row.noIndex ? ' · noindex' : ''}</span>
                </button>
                <button type="button" onClick={() => remove(row.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10">
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
