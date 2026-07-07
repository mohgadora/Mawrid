'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminStatusChip } from '@/components/admin/stat-card'
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

type Brand = {
  id: number
  name: string
  nameEn: string
  products: number
  status: string
  logo: string
}

const INITIAL: Brand[] = [
  { id: 1, name: 'النخيل', nameEn: 'Al Nakheel', products: 142, status: 'active', logo: '🌴' },
  { id: 2, name: 'الحصاد', nameEn: 'Al Hassad', products: 51, status: 'active', logo: '🌾' },
  { id: 3, name: 'شمس', nameEn: 'Shams', products: 34, status: 'active', logo: '☀️' },
  { id: 4, name: 'البحر الأحمر', nameEn: 'Red Sea', products: 28, status: 'active', logo: '🌊' },
  { id: 5, name: 'الوادي', nameEn: 'Al Wadi', products: 19, status: 'inactive', logo: '🏔️' },
  { id: 6, name: 'زيت الجبل', nameEn: 'Jabal Oil', products: 12, status: 'active', logo: '🫙' },
]

const EMPTY = { name: '', nameEn: '', logo: '🏷️', status: 'active', products: 0 }

export default function BrandsPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { items, add, update, remove } = useAdminCollection<Brand>('admin-brands', INITIAL)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [toDelete, setToDelete] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)

  const filtered = items.filter((b) => !q || b.name.includes(q) || b.nameEn.toLowerCase().includes(q.toLowerCase()))

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  function openEdit(brand: Brand) {
    setEditing(brand)
    setForm({ name: brand.name, nameEn: brand.nameEn, logo: brand.logo, status: brand.status, products: brand.products })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !form.nameEn.trim()) return
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
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="بحث عن علامة تجارية…" className="ps-9 h-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}><Plus className="size-4" /> إضافة علامة</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-5 py-3 text-start font-medium">الشعار</th>
              <th className="px-5 py-3 text-start font-medium">الاسم (عربي)</th>
              <th className="px-5 py-3 text-start font-medium">الاسم (إنجليزي)</th>
              <th className="px-5 py-3 text-start font-medium">المنتجات</th>
              <th className="px-5 py-3 text-start font-medium">الحالة</th>
              <th className="px-5 py-3 text-start font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-xl">{b.logo}</td>
                <td className="px-5 py-3 text-xs font-semibold text-foreground">{b.name}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{b.nameEn}</td>
                <td className="px-5 py-3 text-xs text-foreground">{b.products}</td>
                <td className="px-5 py-3"><AdminStatusChip status={b.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setToDelete(b.id)}><Trash2 className="size-3.5" /></Button>
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
            <DialogTitle>{editing ? 'تعديل علامة' : 'إضافة علامة'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="الاسم (عربي)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="الاسم (إنجليزي)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
            <Input placeholder="الشعار (إيموجي)" value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} />
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
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
        title="حذف العلامة؟"
        description="سيتم حذف العلامة التجارية من القائمة."
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
