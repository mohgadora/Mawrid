'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/lib/toast'
import {
  getAdminFlashSales,
  createFlashSaleApi,
  updateFlashSaleApi,
  deleteFlashSaleApi,
  getFlashSaleApi,
  addProductToFlashSaleApi,
  removeProductFromFlashSaleApi,
} from '@/lib/api-client'

type FlashSale = {
  id: string
  name: string
  nameEn?: string | null
  startsAt: string
  endsAt: string
  discountType: string
  discountValue: string
  maxDiscountAmount?: string | null
  active: boolean
  createdAt: string
}

type SaleProduct = {
  id: string
  productId: string
  productName: string
  productNameAr?: string | null
  productImage?: string | null
  overridePrice?: string | null
  stockLimit?: number | null
  soldCount: number
}

type FlashSaleWithProducts = FlashSale & { products: SaleProduct[] }

const EMPTY_FORM = {
  name: '',
  nameEn: '',
  startsAt: '',
  endsAt: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  active: true,
}

function saleStatus(sale: FlashSale) {
  if (!sale.active) return 'disabled'
  const now = new Date()
  const starts = new Date(sale.startsAt)
  const ends = new Date(sale.endsAt)
  if (now < starts) return 'upcoming'
  if (now > ends) return 'ended'
  return 'active'
}

function StatusChip({ sale }: { sale: FlashSale }) {
  const s = saleStatus(sale)
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active:   { label: 'نشط', variant: 'default' },
    upcoming: { label: 'قادم', variant: 'secondary' },
    ended:    { label: 'منتهي', variant: 'outline' },
    disabled: { label: 'معطّل', variant: 'destructive' },
  }
  const { label, variant } = map[s] ?? map.disabled
  return <Badge variant={variant}>{label}</Badge>
}

function toLocalDatetime(iso: string) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function CampaignsPage() {
  const { error: toastError } = useToast()
  const [sales, setSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [saleDialog, setSaleDialog] = useState<{ open: boolean; editing?: FlashSale }>({ open: false })
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FlashSale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [productsDialog, setProductsDialog] = useState<{ open: boolean; sale?: FlashSaleWithProducts }>({ open: false })
  const [productsLoading, setProductsLoading] = useState(false)
  const [newProductId, setNewProductId] = useState('')
  const [newOverridePrice, setNewOverridePrice] = useState('')
  const [newStockLimit, setNewStockLimit] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminFlashSales()
      setSales(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setSaleDialog({ open: true })
  }

  function openEdit(sale: FlashSale) {
    setForm({
      name: sale.name,
      nameEn: sale.nameEn ?? '',
      startsAt: toLocalDatetime(sale.startsAt),
      endsAt: toLocalDatetime(sale.endsAt),
      discountType: sale.discountType ?? 'percentage',
      discountValue: sale.discountValue,
      maxDiscountAmount: sale.maxDiscountAmount ?? '',
      active: sale.active,
    })
    setSaleDialog({ open: true, editing: sale })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        nameEn: form.nameEn || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        active: form.active,
      }
      if (saleDialog.editing) {
        await updateFlashSaleApi(saleDialog.editing.id, payload)
      } else {
        await createFlashSaleApi(payload)
      }
      setSaleDialog({ open: false })
      await load()
    } catch (e: any) {
      toastError(e?.message ?? 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFlashSaleApi(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      toastError(e?.message ?? 'حدث خطأ')
    } finally {
      setDeleting(false)
    }
  }

  async function openProducts(sale: FlashSale) {
    setProductsLoading(true)
    setProductsDialog({ open: true })
    setNewProductId('')
    setNewOverridePrice('')
    setNewStockLimit('')
    try {
      const full = await getFlashSaleApi(sale.id)
      setProductsDialog({ open: true, sale: full })
    } finally {
      setProductsLoading(false)
    }
  }

  async function handleAddProduct() {
    if (!productsDialog.sale || !newProductId.trim()) return
    setAddingProduct(true)
    try {
      await addProductToFlashSaleApi(
        productsDialog.sale.id,
        newProductId.trim(),
        newOverridePrice || undefined,
        newStockLimit ? Number(newStockLimit) : undefined,
      )
      const full = await getFlashSaleApi(productsDialog.sale.id)
      setProductsDialog({ open: true, sale: full })
      setNewProductId('')
      setNewOverridePrice('')
      setNewStockLimit('')
    } catch (e: any) {
      toastError(e?.message ?? 'حدث خطأ')
    } finally {
      setAddingProduct(false)
    }
  }

  async function handleRemoveProduct(productId: string) {
    if (!productsDialog.sale) return
    try {
      await removeProductFromFlashSaleApi(productsDialog.sale.id, productId)
      const full = await getFlashSaleApi(productsDialog.sale.id)
      setProductsDialog({ open: true, sale: full })
    } catch (e: any) {
      toastError(e?.message ?? 'حدث خطأ')
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">العروض السريعة (Flash Sales)</h1>
        <Button onClick={openCreate}>إنشاء عرض</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">جاري التحميل…</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البداية</TableHead>
                <TableHead className="text-right">النهاية</TableHead>
                <TableHead className="text-right">الخصم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد عروض بعد
                  </TableCell>
                </TableRow>
              )}
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.name}</TableCell>
                  <TableCell>{formatDate(sale.startsAt)}</TableCell>
                  <TableCell>{formatDate(sale.endsAt)}</TableCell>
                  <TableCell>
                    {sale.discountValue}
                    {sale.discountType === 'percentage' ? '%' : ' ر.س'}
                  </TableCell>
                  <TableCell><StatusChip sale={sale} /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openProducts(sale)}>المنتجات</Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(sale)}>تعديل</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(sale)}>حذف</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={saleDialog.open} onOpenChange={(o) => !o && setSaleDialog({ open: false })}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{saleDialog.editing ? 'تعديل العرض' : 'إنشاء عرض سريع'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>الاسم (عربي) *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>تاريخ البداية *</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>تاريخ النهاية *</Label>
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>نوع الخصم</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm((f) => ({ ...f, discountType: v || 'percentage' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (ر.س)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>قيمة الخصم *</Label>
                <Input type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>الحد الأقصى للخصم (ر.س)</Label>
              <Input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} dir="ltr" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaleDialog({ open: false })}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد من حذف العرض <strong>{deleteTarget?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'جاري الحذف…' : 'حذف'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={productsDialog.open} onOpenChange={(o) => !o && setProductsDialog({ open: false })}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>منتجات العرض: {productsDialog.sale?.name}</DialogTitle>
          </DialogHeader>
          {productsLoading ? (
            <p className="text-muted-foreground py-4">جاري التحميل…</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">سعر العرض</TableHead>
                      <TableHead className="text-right">الحد / المباع</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(productsDialog.sale?.products ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">لا توجد منتجات</TableCell>
                      </TableRow>
                    )}
                    {(productsDialog.sale?.products ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.productNameAr ?? p.productName}</TableCell>
                        <TableCell>{p.overridePrice ?? '—'}</TableCell>
                        <TableCell>{p.stockLimit != null ? `${p.soldCount} / ${p.stockLimit}` : `مباع: ${p.soldCount}`}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveProduct(p.productId)}>إزالة</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border rounded-md p-4 space-y-3">
                <p className="font-medium text-sm">إضافة منتج</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-3">
                    <Label>معرّف المنتج (ID) *</Label>
                    <Input value={newProductId} onChange={(e) => setNewProductId(e.target.value)} placeholder="product-uuid" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label>سعر العرض (اختياري)</Label>
                    <Input type="number" value={newOverridePrice} onChange={(e) => setNewOverridePrice(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label>حد المخزون (اختياري)</Label>
                    <Input type="number" value={newStockLimit} onChange={(e) => setNewStockLimit(e.target.value)} dir="ltr" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={handleAddProduct} disabled={addingProduct || !newProductId.trim()}>
                      {addingProduct ? '…' : 'إضافة'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductsDialog({ open: false })}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
