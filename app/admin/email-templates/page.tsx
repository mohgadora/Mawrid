'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Mail, Save, Trash2, Send, Pencil } from 'lucide-react'
import { fetchEmailTemplates, upsertEmailTemplateApi, deleteEmailTemplateApi, testEmailTemplateApi, type EmailTemplateRow } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

const EVENTS = ['order_confirmed', 'order_shipped', 'order_delivered', 'refund_approved', 'wallet_topup', 'welcome']
const EMPTY = { id: '', event: 'order_confirmed', subjectAr: '', bodyAr: '', subjectEn: '', bodyEn: '', active: true }

export default function AdminEmailTemplatesPage() {
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<EmailTemplateRow[]>('admin/email-templates', fetchEmailTemplates)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!form.event || !form.subjectAr || !form.bodyAr) return
    setBusy(true)
    try {
      await upsertEmailTemplateApi({
        event: form.event, subjectAr: form.subjectAr, bodyAr: form.bodyAr,
        subjectEn: form.subjectEn || null, bodyEn: form.bodyEn || null, active: form.active,
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

  function edit(t: EmailTemplateRow) {
    setForm({ id: t.id, event: t.event, subjectAr: t.subjectAr, bodyAr: t.bodyAr, subjectEn: t.subjectEn ?? '', bodyEn: t.bodyEn ?? '', active: t.active })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id: string) {
    try { await deleteEmailTemplateApi(id); toast.success('تم الحذف'); mutate() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'تعذّر الحذف') }
  }

  async function test(id: string) {
    const to = window.prompt('أدخل بريداً لإرسال معاينة:')
    if (!to) return
    try { await testEmailTemplateApi(id, to); toast.success('تم إرسال المعاينة') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'تعذّر الإرسال') }
  }

  if (isLoading) return <AdminPageSkeleton />
  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Mail className="size-6 text-primary" />
        قوالب البريد {form.id && <span className="text-sm font-normal text-muted-foreground">— تعديل</span>}
      </h1>
      <p className="text-sm text-muted-foreground">استخدم متغيّرات مثل <code className="rounded bg-muted px-1">{'{{name}}'}</code> و <code className="rounded bg-muted px-1">{'{{orderRef}}'}</code> و <code className="rounded bg-muted px-1">{'{{amount}}'}</code>.</p>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} className={input} disabled={Boolean(form.id)}>
          {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <input value={form.subjectAr} onChange={(e) => setForm({ ...form, subjectAr: e.target.value })} placeholder="الموضوع (عربي)" className={input} />
        <textarea value={form.bodyAr} onChange={(e) => setForm({ ...form, bodyAr: e.target.value })} placeholder="نص البريد HTML (عربي)" rows={6} className={input} />
        <input value={form.subjectEn} onChange={(e) => setForm({ ...form, subjectEn: e.target.value })} placeholder="Subject (English, optional)" dir="ltr" className={input} />
        <textarea value={form.bodyEn} onChange={(e) => setForm({ ...form, bodyEn: e.target.value })} placeholder="Body HTML (English, optional)" dir="ltr" rows={4} className={input} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> مفعّل
          </label>
          <button type="button" onClick={save} disabled={busy || !form.subjectAr || !form.bodyAr} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Save className="size-4" /> حفظ
          </button>
          {form.id && <button type="button" onClick={() => setForm(EMPTY)} className="text-sm text-muted-foreground hover:text-foreground">جديد</button>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!data?.length ? <p className="text-sm text-muted-foreground">لا توجد قوالب بعد</p> : (
          <ul className="divide-y divide-border text-sm">
            {data.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{t.event}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.subjectAr}</span>
                </span>
                <span className={t.active ? 'rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success' : 'rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground'}>{t.active ? 'مفعّل' : 'معطّل'}</span>
                <button type="button" onClick={() => test(t.id)} aria-label="اختبار" className="grid size-8 place-items-center rounded-lg text-primary hover:bg-primary/10"><Send className="size-4" /></button>
                <button type="button" onClick={() => edit(t)} aria-label="تعديل" className="grid size-8 place-items-center rounded-lg text-foreground hover:bg-accent"><Pencil className="size-4" /></button>
                <button type="button" onClick={() => remove(t.id)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
