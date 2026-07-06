'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Search, MessageSquare, InboxIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import { getSupportTickets } from '@/lib/api-client'
import type { TicketPriority } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Ticket = Awaited<ReturnType<typeof getSupportTickets>>[number]

const PRIORITY_AR: Record<TicketPriority, string> = { urgent: 'عاجل جداً', high: 'عالي', medium: 'متوسط', low: 'منخفض' }
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: 'text-destructive', high: 'text-orange-500', medium: 'text-yellow-500', low: 'text-muted-foreground',
}

const EMPTY_FORM = { subject: '', body: '', priority: 'medium' }

export default function SupportTicketsPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const router = useRouter()
  const [q, setQ] = useState('')
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getSupportTickets>>>('admin/tickets', getSupportTickets)

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; ticket?: Ticket }>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = (data ?? []).filter(
    (tk) => !q || tk.subject.includes(q) || tk.user.includes(q) || tk.id.includes(q)
  )

  function openCreate() { setForm({ ...EMPTY_FORM }); setCreateDialog(true) }
  function openEdit(tk: Ticket) {
    setForm({ subject: tk.subject, body: '', priority: tk.priority })
    setEditDialog({ open: true, ticket: tk })
  }

  async function handleCreate() {
    if (!form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      success('تم إنشاء التذكرة')
      setCreateDialog(false)
      mutate()
    } catch { toastError('فشل إنشاء التذكرة') } finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!editDialog.ticket) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/admin/tickets/${editDialog.ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: form.subject, priority: form.priority }),
      })
      if (!res.ok) throw new Error(await res.text())
      success('تم تحديث التذكرة')
      setEditDialog({ open: false })
      mutate()
    } catch { toastError('فشل التحديث') } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/admin/tickets/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      success('تم حذف التذكرة')
      setDeleteTarget(null)
      mutate()
    } catch { toastError('فشل الحذف') } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('searchTickets')} className="h-9 ps-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreate}>
          <Plus className="size-4" /> إنشاء تذكرة
        </Button>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {() => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{t('ticketSubject')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('userLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('priorityLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('dateLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('statusLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tk) => (
                  <tr key={tk.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[200px] truncate">{tk.subject}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tk.user}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${PRIORITY_COLOR[tk.priority]}`}>{PRIORITY_AR[tk.priority]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tk.created}</td>
                    <td className="px-4 py-3"><AdminStatusChip status={tk.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => router.push(`/admin/support/tickets/${tk.id}`)} className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground transition-colors hover:bg-accent/80">
                          <MessageSquare className="size-3" /> {t('openLabel')}
                        </button>
                        <button onClick={() => openEdit(tk)} className="grid size-6 place-items-center rounded-md border border-border hover:bg-accent text-muted-foreground">
                          <Pencil className="size-3" />
                        </button>
                        <button onClick={() => setDeleteTarget(tk)} className="grid size-6 place-items-center rounded-md border border-destructive/30 hover:bg-destructive/5 text-destructive">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد تذاكر</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={(o) => !o && setCreateDialog(false)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إنشاء تذكرة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>الموضوع *</Label>
              <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>الرسالة *</Label>
              <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} className="resize-none" />
            </div>
            <div className="space-y-1">
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v ?? f.priority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">عاجل جداً</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={saving || !form.subject.trim() || !form.body.trim()}>{saving ? '…' : 'إنشاء'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => !o && setEditDialog({ open: false })}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تعديل التذكرة</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>الموضوع</Label>
              <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v ?? f.priority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">عاجل جداً</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>إلغاء</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? '…' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p>هل تريد حذف التذكرة <strong>{deleteTarget?.subject}</strong>؟ لا يمكن التراجع.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? '…' : 'حذف'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
