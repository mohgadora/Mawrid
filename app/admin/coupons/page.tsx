'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/lib/toast'

type Coupon = {
  id: string
  code: string
  type: string
  value: string
  minOrderAmount: string | null
  maxDiscountAmount: string | null
  usageLimitTotal: number | null
  usageLimitPerCustomer: number
  firstOrderOnly: boolean
  startsAt: string | null
  expiresAt: string | null
  active: boolean
  usedCount: number
  createdAt: string
}

const EMPTY_FORM = {
  code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscountAmount: '',
  usageLimitTotal: '', usageLimitPerCustomer: '1', firstOrderOnly: false,
  startsAt: '', expiresAt: '', active: true,
}

export default function AdminCouponsPage() {
  const { error: toastError } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Coupon }>({ open: false })
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/v1/admin/coupons')
      if (!res.ok) throw new Error()
      setCoupons(await res.json())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setDialog({ open: true })
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code, type: c.type, value: c.value,
      minOrderAmount: c.minOrderAmount ?? '', maxDiscountAmount: c.maxDiscountAmount ?? '',
      usageLimitTotal: c.usageLimitTotal != null ? String(c.usageLimitTotal) : '',
      usageLimitPerCustomer: String(c.usageLimitPerCustomer),
      firstOrderOnly: c.firstOrderOnly, startsAt: c.startsAt?.slice(0, 16) ?? '',
      expiresAt: c.expiresAt?.slice(0, 16) ?? '', active: c.active,
    })
    setDialog({ open: true, editing: c })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        code: form.code, type: form.type, value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimitTotal: form.usageLimitTotal ? Number(form.usageLimitTotal) : null,
        usageLimitPerCustomer: Number(form.usageLimitPerCustomer || 1),
        firstOrderOnly: form.firstOrderOnly, active: form.active,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }
      const url = dialog.editing ? `/api/v1/admin/coupons/${dialog.editing.id}` : '/api/v1/admin/coupons'
      const res = await fetch(url, {
        method: dialog.editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setDialog({ open: false })
      await load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/admin/coupons/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setDeleteTarget(null)
      await load()
    } catch {
      toastError('فشل حذف الكوبون')
    } finally {
      setDeleting(false)
    }
  }

  function setF(key: string, val: unknown) { setForm((f) => ({ ...f, [key]: val })) }

  return (
    <div className="p-6 space-y-5 route-fade" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketPercent className="size-5 text-primary" />
          <h1 className="text-xl font-bold">كوبونات الخصم</h1>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" /> إنشاء كوبون
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive mb-2">فشل تحميل الكوبونات</p>
          <button className="text-xs text-primary underline" onClick={load}>إعادة المحاولة</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">النوع / القيمة</TableHead>
                <TableHead className="text-right">الاستخدام</TableHead>
                <TableHead className="text-right">الانتهاء</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">لا توجد كوبونات</TableCell>
                </TableRow>
              )}
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold text-primary">{c.code}</TableCell>
                  <TableCell>
                    {c.type === 'percentage' ? `${c.value}%` : `${c.value} ر.س`}
                    {c.firstOrderOnly && <Badge variant="secondary" className="ms-1 text-[10px]">أول طلب</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.usedCount}{c.usageLimitTotal != null ? ` / ${c.usageLimitTotal}` : ''}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-SA') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.active ? 'default' : 'outline'}>{c.active ? 'نشط' : 'معطّل'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false })}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? 'تعديل الكوبون' : 'إنشاء كوبون جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>الكود *</Label>
                <Input value={form.code} onChange={(e) => setF('code', e.target.value.toUpperCase())} placeholder="SAVE20" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>نوع الخصم</Label>
                <Select value={form.type} onValueChange={(v) => setF('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (ر.س)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>قيمة الخصم *</Label>
                <Input type="number" value={form.value} onChange={(e) => setF('value', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>الحد الأقصى للخصم</Label>
                <Input type="number" value={form.maxDiscountAmount} onChange={(e) => setF('maxDiscountAmount', e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>الحد الأدنى للطلب</Label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setF('minOrderAmount', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>الحد الإجمالي للاستخدام</Label>
                <Input type="number" value={form.usageLimitTotal} onChange={(e) => setF('usageLimitTotal', e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>تاريخ البداية</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setF('startsAt', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>تاريخ الانتهاء</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setF('expiresAt', e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setF('active', v)} />
                <Label>نشط</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.firstOrderOnly} onCheckedChange={(v) => setF('firstOrderOnly', v)} />
                <Label>أول طلب فقط</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog({ open: false })}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'جاري الحفظ…' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p>هل تريد حذف الكوبون <strong>{deleteTarget?.code}</strong>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? '…' : 'حذف'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
