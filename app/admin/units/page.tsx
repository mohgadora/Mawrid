'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminCollection } from '@/lib/use-admin-collection'
import { useToast } from '@/lib/toast'
import { useI18n } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Unit = {
  id: number
  name: string
  nameEn: string
  abbr: string
  base: string
  ratio: string
  usedIn: number
}

const INITIAL: Unit[] = [
  { id: 1, name: 'كرتون', nameEn: 'Carton', abbr: 'كرتن', base: 'كجم', ratio: '—', usedIn: 1840 },
  { id: 2, name: 'قطعة', nameEn: 'Piece', abbr: 'قطعة', base: '—', ratio: '—', usedIn: 920 },
  { id: 3, name: 'طبلية', nameEn: 'Pallet', abbr: 'طبلية', base: 'كرتون', ratio: '20', usedIn: 310 },
  { id: 4, name: 'كيس', nameEn: 'Sack', abbr: 'كيس', base: 'كجم', ratio: '—', usedIn: 450 },
  { id: 5, name: 'لتر', nameEn: 'Liter', abbr: 'لتر', base: 'مل', ratio: '1000', usedIn: 280 },
  { id: 6, name: 'كيلوجرام', nameEn: 'Kilogram', abbr: 'كجم', base: 'جرام', ratio: '1000', usedIn: 1100 },
]

const EMPTY = { name: '', nameEn: '', abbr: '', base: '—', ratio: '—', usedIn: 0 }

export default function UnitsPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { items, add, update, remove } = useAdminCollection<Unit>('admin-units', INITIAL)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [toDelete, setToDelete] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(unit: Unit) {
    setEditing(unit)
    setForm({ name: unit.name, nameEn: unit.nameEn, abbr: unit.abbr, base: unit.base, ratio: unit.ratio, usedIn: unit.usedIn })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !form.abbr.trim()) return
    try {
      if (editing) await update(editing.id, form)
      else await add(form)
      setDialogOpen(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" /> إضافة وحدة</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-5 py-3 text-start font-medium">اسم الوحدة</th>
              <th className="px-5 py-3 text-start font-medium">اختصار</th>
              <th className="px-5 py-3 text-start font-medium">الوحدة الأساسية</th>
              <th className="px-5 py-3 text-start font-medium">معامل التحويل</th>
              <th className="px-5 py-3 text-start font-medium">مستخدمة في</th>
              <th className="px-5 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-xs font-semibold text-foreground">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">{u.nameEn}</p>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{u.abbr}</td>
                <td className="px-5 py-3 text-xs text-foreground">{u.base}</td>
                <td className="px-5 py-3 text-xs text-foreground">{u.ratio}</td>
                <td className="px-5 py-3 text-xs text-foreground">{u.usedIn.toLocaleString()} منتج</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setToDelete(u.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل وحدة' : 'إضافة وحدة'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="الاسم (عربي)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="الاسم (إنجليزي)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
            <Input placeholder="الاختصار" value={form.abbr} onChange={(e) => setForm((f) => ({ ...f, abbr: e.target.value }))} />
            <Input placeholder="الوحدة الأساسية" value={form.base} onChange={(e) => setForm((f) => ({ ...f, base: e.target.value }))} />
            <Input placeholder="معامل التحويل" value={form.ratio} onChange={(e) => setForm((f) => ({ ...f, ratio: e.target.value }))} dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={save}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="حذف الوحدة؟"
        description="سيتم حذف الوحدة من القائمة."
        confirmLabel={t('deleteAddress')}
        cancelLabel={t('cancel')}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await remove(toDelete)
            setToDelete(null)
            success(t('toastProfileSaved'))
          } catch {
            toastError(t('toastSaveFailed'))
          }
        }}
      />
    </div>
  )
}
