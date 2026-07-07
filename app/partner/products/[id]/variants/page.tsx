'use client'

import { useState, use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Plus, Pencil, Trash2, Tag, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  fetchPartnerVariants,
  createPartnerVariantApi,
  updatePartnerVariantApi,
  deletePartnerVariantApi,
  type PartnerVariant,
} from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

type OptionRow = { key: string; value: string }

type VariantForm = {
  sku: string
  barcode: string
  price: string
  compareAtPrice: string
  stock: string
  lowStockThreshold: string
  weight: string
  options: OptionRow[]
  isDefault: boolean
  active: boolean
}

const EMPTY_FORM: VariantForm = {
  sku: '', barcode: '', price: '', compareAtPrice: '', stock: '0',
  lowStockThreshold: '5', weight: '', options: [{ key: '', value: '' }],
  isDefault: false, active: true,
}

function variantToForm(v: PartnerVariant): VariantForm {
  const optionRows = Object.entries(v.options ?? {}).map(([key, value]) => ({ key, value }))
  return {
    sku: v.sku,
    barcode: v.barcode ?? '',
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? '',
    stock: String(v.stock),
    lowStockThreshold: String(v.lowStockThreshold),
    weight: v.weight ?? '',
    options: optionRows.length ? optionRows : [{ key: '', value: '' }],
    isDefault: v.isDefault,
    active: v.active,
  }
}

function formToPayload(f: VariantForm) {
  const options: Record<string, string> = {}
  for (const row of f.options) {
    if (row.key.trim() && row.value.trim()) options[row.key.trim()] = row.value.trim()
  }
  return {
    sku: f.sku.trim(),
    barcode: f.barcode.trim() || undefined,
    price: parseFloat(f.price) || 0,
    compareAtPrice: parseFloat(f.compareAtPrice) || undefined,
    stock: parseInt(f.stock) || 0,
    lowStockThreshold: parseInt(f.lowStockThreshold) || 5,
    weight: parseFloat(f.weight) || undefined,
    options,
    isDefault: f.isDefault,
    active: f.active,
  }
}

export default function VariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params)
  const { success, error: toastError } = useToast()
  const { data: variants, isLoading, mutate } = useSWR(
    `partner/products/${productId}/variants`,
    () => fetchPartnerVariants(productId),
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VariantForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<string | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(v: PartnerVariant) {
    setEditingId(v.id)
    setForm(variantToForm(v))
    setDialogOpen(true)
  }

  function setField<K extends keyof VariantForm>(k: K, v: VariantForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function setOptionRow(i: number, field: 'key' | 'value', val: string) {
    setForm((f) => {
      const options = [...f.options]
      options[i] = { ...options[i], [field]: val }
      return { ...f, options }
    })
  }

  function addOptionRow() {
    setForm((f) => ({ ...f, options: [...f.options, { key: '', value: '' }] }))
  }

  function removeOptionRow(i: number) {
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))
  }

  async function save() {
    if (!form.sku.trim()) { toastError('SKU مطلوب'); return }
    if (!form.price || parseFloat(form.price) <= 0) { toastError('السعر يجب أن يكون أكبر من صفر'); return }
    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (editingId) {
        await updatePartnerVariantApi(productId, editingId, payload)
      } else {
        await createPartnerVariantApi(productId, payload)
      }
      await mutate()
      setDialogOpen(false)
      success(editingId ? 'تم تحديث المتغير' : 'تم إضافة المتغير')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(v: PartnerVariant) {
    try {
      await updatePartnerVariantApi(productId, v.id, { active: !v.active })
      await mutate()
    } catch {
      toastError('فشل تغيير الحالة')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await deletePartnerVariantApi(productId, toDelete)
      await mutate()
      success('تم حذف المتغير')
    } catch {
      toastError('فشل الحذف')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-5 route-fade">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/partner/products" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="size-4" />
          </Link>
          <Tag className="size-4 text-primary" />
          <h1 className="text-base font-semibold text-foreground">إدارة المتغيرات</h1>
          <span className="text-xs text-muted-foreground font-mono">{productId.slice(0, 8)}…</span>
        </div>
        <Button size="sm" className="gap-1" onClick={openAdd}>
          <Plus className="size-3.5" />
          إضافة متغير
        </Button>
      </div>

      {isLoading ? (
        <AdminPageSkeleton rows={4} cards={0} />
      ) : !variants?.length ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Package className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">لا توجد متغيرات بعد</p>
          <p className="text-xs text-muted-foreground mt-1">أضف متغيرات لهذا المنتج (مقاسات، ألوان، …)</p>
          <Button size="sm" className="mt-4 gap-1" onClick={openAdd}>
            <Plus className="size-3.5" /> إضافة أول متغير
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">SKU</th>
                <th className="px-4 py-3 text-start font-medium">الخيارات</th>
                <th className="px-4 py-3 text-start font-medium">السعر</th>
                <th className="px-4 py-3 text-start font-medium">المخزون</th>
                <th className="px-4 py-3 text-start font-medium">افتراضي</th>
                <th className="px-4 py-3 text-start font-medium">مفعّل</th>
                <th className="px-4 py-3 text-start font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(v.options ?? {}).map(([k, val]) => (
                        <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {k}: {val}
                        </span>
                      ))}
                      {!Object.keys(v.options ?? {}).length && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">{Number(v.price).toLocaleString('ar-SA')} ر.س</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={v.stock <= v.lowStockThreshold ? 'text-orange-600 font-semibold' : ''}>
                      {v.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.isDefault && (
                      <span className="rounded-full bg-primary/10 text-primary text-[11px] px-2 py-0.5 font-medium">افتراضي</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={v.active} onCheckedChange={() => toggleActive(v)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(v)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setToDelete(v.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل المتغير' : 'إضافة متغير'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* SKU + Barcode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">SKU *</label>
                <Input dir="ltr" placeholder="PROD-RED-XL" value={form.sku} onChange={(e) => setField('sku', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Barcode</label>
                <Input dir="ltr" placeholder="123456789" value={form.barcode} onChange={(e) => setField('barcode', e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Price + Compare-at */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">السعر (ر.س) *</label>
                <Input type="number" min="0" step="0.01" dir="ltr" value={form.price} onChange={(e) => setField('price', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">السعر قبل الخصم</label>
                <Input type="number" min="0" step="0.01" dir="ltr" value={form.compareAtPrice} onChange={(e) => setField('compareAtPrice', e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Stock + Threshold + Weight */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">المخزون</label>
                <Input type="number" min="0" dir="ltr" value={form.stock} onChange={(e) => setField('stock', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">حد التنبيه</label>
                <Input type="number" min="0" dir="ltr" value={form.lowStockThreshold} onChange={(e) => setField('lowStockThreshold', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">الوزن (كجم)</label>
                <Input type="number" min="0" step="0.001" dir="ltr" value={form.weight} onChange={(e) => setField('weight', e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">الخيارات (مثال: لون، مقاس)</label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2" onClick={addOptionRow}>
                  <Plus className="size-3" /> إضافة
                </Button>
              </div>
              {form.options.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="لون" value={row.key} onChange={(e) => setOptionRow(i, 'key', e.target.value)} className="h-8 text-xs flex-1" />
                  <span className="text-muted-foreground text-xs">:</span>
                  <Input placeholder="أحمر" value={row.value} onChange={(e) => setOptionRow(i, 'value', e.target.value)} className="h-8 text-xs flex-1" />
                  {form.options.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => removeOptionRow(i)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.isDefault} onCheckedChange={(v) => setField('isDefault', v)} />
                <span className="text-xs text-foreground">متغير افتراضي</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.active} onCheckedChange={(v) => setField('active', v)} />
                <span className="text-xs text-foreground">مفعّل</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? 'جاري الحفظ…' : editingId ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="حذف المتغير"
        description="هل أنت متأكد من حذف هذا المتغير؟ لا يمكن التراجع."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  )
}
