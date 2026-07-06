'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BookOpen, Plus, Trash2, Eye, Pencil } from 'lucide-react'
import { fetchAdminBlogPosts, createBlogPostApi, updateBlogPostApi, deleteBlogPostApi, type BlogPostRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EMPTY = { id: '', slug: '', titleAr: '', titleEn: '', excerptAr: '', bodyAr: '', coverImage: '', status: 'draft' }

export default function AdminBlogPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<BlogPostRow[]>('admin/blog', fetchAdminBlogPosts)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!form.titleAr || !form.bodyAr) return
    setBusy(true)
    try {
      const payload = {
        slug: form.slug || undefined, titleAr: form.titleAr, titleEn: form.titleEn || null,
        excerptAr: form.excerptAr || null, bodyAr: form.bodyAr, coverImage: form.coverImage || null, status: form.status,
      }
      if (form.id) await updateBlogPostApi(form.id, payload)
      else await createBlogPostApi(payload)
      toast.success('تم الحفظ')
      setForm(EMPTY)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الحفظ')
    } finally {
      setBusy(false)
    }
  }

  function edit(p: BlogPostRow) {
    setForm({ id: p.id, slug: p.slug, titleAr: p.titleAr, titleEn: p.titleEn ?? '', excerptAr: p.excerptAr ?? '', bodyAr: p.bodyAr, coverImage: p.coverImage ?? '', status: p.status })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: string) {
    try { await deleteBlogPostApi(id); toast.success('تم الحذف'); mutate() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'تعذّر الحذف') }
  }

  if (isLoading) return <AdminPageSkeleton />
  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <BookOpen className="size-6 text-primary" />
        المدونة {form.id && <span className="text-sm font-normal text-muted-foreground">— تعديل</span>}
      </h1>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" className={input} />
          <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Title (English)" dir="ltr" className={input} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="الرابط (slug) — تلقائي إن تُرك فارغاً" dir="ltr" className={input} />
          <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="صورة الغلاف (رابط)" dir="ltr" className={input} />
        </div>
        <input value={form.excerptAr} onChange={(e) => setForm({ ...form, excerptAr: e.target.value })} placeholder="مقتطف قصير" className={input} />
        <textarea value={form.bodyAr} onChange={(e) => setForm({ ...form, bodyAr: e.target.value })} placeholder="نص المقال" rows={8} className={input} />
        <div className="flex items-center gap-3">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${input} w-40`}>
            <option value="draft">مسودّة</option>
            <option value="published">منشور</option>
          </select>
          <button type="button" onClick={save} disabled={busy || !form.titleAr || !form.bodyAr} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Plus className="size-4" /> {form.id ? 'حفظ التعديل' : 'نشر/حفظ'}
          </button>
          {form.id && <button type="button" onClick={() => setForm(EMPTY)} className="text-sm text-muted-foreground hover:text-foreground">إلغاء</button>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? <p className="text-sm text-muted-foreground">لا توجد مقالات بعد</p> : (
          <ul className="divide-y divide-border text-sm">
            {data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">{p.titleAr}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={p.status === 'published' ? 'text-success' : 'text-muted-foreground'}>{p.status === 'published' ? 'منشور' : 'مسودّة'}</span>
                    <span className="flex items-center gap-1"><Eye className="size-3" />{p.viewCount}</span>
                  </span>
                </span>
                <button type="button" onClick={() => edit(p)} aria-label="تعديل" className="grid size-8 place-items-center rounded-lg text-foreground hover:bg-accent"><Pencil className="size-4" /></button>
                <button type="button" onClick={() => remove(p.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
