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

type Attribute = {
  id: number
  name: string
  nameEn: string
  type: string
  unit: string
  values: number
  usedIn: number
}

const INITIAL: Attribute[] = [
  { id: 1, name: 'الوزن', nameEn: 'Weight', type: 'رقمي', unit: 'كجم', values: 12, usedIn: 890 },
  { id: 2, name: 'الحجم', nameEn: 'Volume', type: 'رقمي', unit: 'لتر', values: 8, usedIn: 340 },
  { id: 3, name: 'النكهة', nameEn: 'Flavor', type: 'قائمة', unit: '—', values: 24, usedIn: 215 },
  { id: 4, name: 'بلد المنشأ', nameEn: 'Origin', type: 'قائمة', unit: '—', values: 18, usedIn: 1200 },
  { id: 5, name: 'العمر الافتراضي', nameEn: 'Shelf Life', type: 'رقمي', unit: 'يوم', values: 6, usedIn: 780 },
  { id: 6, name: 'شهادة الجودة', nameEn: 'Certification', type: 'قائمة', unit: '—', values: 9, usedIn: 445 },
]

const EMPTY = { name: '', nameEn: '', type: 'رقمي', unit: '—', values: 0, usedIn: 0 }

export default function AttributesPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { items, add, update, remove } = useAdminCollection<Attribute>('admin-attributes', INITIAL)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Attribute | null>(null)
  const [toDelete, setToDelete] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(attr: Attribute) {
    setEditing(attr)
    setForm({ name: attr.name, nameEn: attr.nameEn, type: attr.type, unit: attr.unit, values: attr.values, usedIn: attr.usedIn })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return
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
        <Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" /> إضافة خاصية</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-5 py-3 text-start font-medium">الخاصية</th>
              <th className="px-5 py-3 text-start font-medium">النوع</th>
              <th className="px-5 py-3 text-start font-medium">الوحدة</th>
              <th className="px-5 py-3 text-start font-medium">القيم</th>
              <th className="px-5 py-3 text-start font-medium">مستخدمة في</th>
              <th className="px-5 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-xs font-semibold text-foreground">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.nameEn}</p>
                </td>
                <td className="px-5 py-3"><span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{a.type}</span></td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{a.unit}</td>
                <td className="px-5 py-3 text-xs text-foreground">{a.values}</td>
                <td className="px-5 py-3 text-xs text-foreground">{a.usedIn.toLocaleString()} منتج</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(a)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setToDelete(a.id)}><Trash2 className="size-3.5" /></Button>
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
            <DialogTitle>{editing ? 'تعديل خاصية' : 'إضافة خاصية'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="الاسم (عربي)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="الاسم (إنجليزي)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="رقمي">رقمي</option>
              <option value="قائمة">قائمة</option>
            </select>
            <Input placeholder="الوحدة" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
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
        title="حذف الخاصية؟"
        description="سيتم حذف الخاصية من القائمة."
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
