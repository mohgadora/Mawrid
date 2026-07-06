'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Package, AlertTriangle, XCircle, Download, History, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

// ─── Types ───────────────────────────────────────────────────────────────────

type InventoryItem = {
  id: string
  name: string
  sku: string
  stock: number
  variantsCount: number
  updatedAt: string
}

type InventoryResponse = {
  data: InventoryItem[]
}

type Movement = {
  id: string
  delta: number
  reason: string
  createdAt: string
  type: 'in' | 'out' | 'adjust'
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stockStatus(stock: number): { label: string; className: string; icon: React.ElementType } {
  if (stock === 0)
    return { label: 'نفد المخزون', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
  if (stock < 10)
    return { label: 'مخزون منخفض', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle }
  return { label: 'متوفر', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Package }
}

function rowHighlight(stock: number): string {
  if (stock === 0) return 'bg-red-50/40 dark:bg-red-950/20'
  if (stock < 10) return 'bg-yellow-50/40 dark:bg-yellow-950/20'
  return ''
}

function fmt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${color ?? ''}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

// ─── Adjust Dialog ────────────────────────────────────────────────────────────

function AdjustDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: InventoryItem
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState({ delta: '', reason: '' })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reason.trim()) {
      toastError('السبب مطلوب')
      return
    }
    const delta = Number(form.delta)
    if (isNaN(delta) || delta === 0) {
      toastError('أدخل كمية تعديل صالحة (موجبة أو سالبة)')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/partner/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id, delta, reason: form.reason }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'خطأ في التعديل')
      success('تم تعديل المخزون بنجاح')
      onSuccess()
      onClose()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const deltaNum = Number(form.delta)
  const previewStock = isNaN(deltaNum) ? item.stock : item.stock + deltaNum

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل المخزون</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1 block text-xs">اسم المنتج</Label>
            <Input value={item.name} readOnly className="bg-muted text-muted-foreground" />
          </div>
          <div>
            <Label className="mb-1 block text-xs">
              كمية التعديل
              <span className="ms-1 text-muted-foreground text-[10px]">(موجب = إضافة، سالب = خصم)</span>
            </Label>
            <Input
              type="number"
              dir="ltr"
              value={form.delta}
              onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value }))}
              placeholder="مثال: 50 أو -10"
              required
            />
            {form.delta !== '' && !isNaN(deltaNum) && deltaNum !== 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                المخزون بعد التعديل:{' '}
                <span className={previewStock < 0 ? 'text-destructive font-semibold' : 'font-semibold'}>
                  {previewStock}
                </span>
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block text-xs">
              السبب <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="أدخل سبب التعديل..."
              rows={3}
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              حفظ التعديل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Movements Dialog ─────────────────────────────────────────────────────────

function MovementsDialog({
  item,
  onClose,
}: {
  item: InventoryItem
  onClose: () => void
}) {
  const { data, isLoading, error } = useSWR<{ data: Movement[] }>(
    `/api/v1/partner/inventory/movements?productId=${item.id}`,
    fetcher,
  )

  const movements = data?.data ?? []

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>سجل حركات المخزون — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <p className="py-8 text-center text-sm text-destructive">تعذّر تحميل السجل</p>
          )}
          {!isLoading && !error && movements.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد حركات مسجّلة</p>
          )}
          {!isLoading && !error && movements.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">التعديل</th>
                  <th className="px-3 py-2 text-start font-medium">السبب</th>
                  <th className="px-3 py-2 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">
                      <span className={m.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {m.delta >= 0 ? `+${m.delta}` : m.delta}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{m.reason}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerInventoryPage() {
  const { error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<InventoryResponse>(
    '/api/v1/partner/inventory',
    fetcher,
  )
  const [search, setSearch] = useState('')
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [movementsItem, setMovementsItem] = useState<InventoryItem | null>(null)

  if (isLoading) return <AdminPageSkeleton cards={3} rows={8} />

  if (error || !data) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="mb-3">تعذّر تحميل بيانات المخزون</p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const items = data.data ?? []

  // Summary counts
  const totalProducts = items.length
  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock < 10).length
  const outOfStockCount = items.filter((i) => i.stock === 0).length

  // Filtered list
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    : items

  function handleExport() {
    try {
      window.open('/api/v1/partner/inventory/export')
    } catch {
      toastError('تعذّر تصدير الملف')
    }
  }

  return (
    <div className="route-fade space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Package} label="إجمالي المنتجات" value={totalProducts} />
        <KpiCard
          icon={AlertTriangle}
          label="مخزون منخفض"
          value={lowStockCount}
          color="text-yellow-500"
        />
        <KpiCard
          icon={XCircle}
          label="نفد المخزون"
          value={outOfStockCount}
          color="text-destructive"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="ابحث باسم المنتج أو SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          dir="rtl"
        />
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="size-4" />
          تصدير CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-3 text-start font-medium">اسم المنتج</th>
              <th className="px-4 py-3 text-start font-medium">SKU</th>
              <th className="px-4 py-3 text-start font-medium">المخزون</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">المتغيرات</th>
              <th className="px-4 py-3 text-start font-medium">آخر تحديث</th>
              <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {search ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات في المخزون'}
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const status = stockStatus(item.stock)
              const StatusIcon = status.icon
              return (
                <tr
                  key={item.id}
                  className={`border-b border-border/50 last:border-0 ${rowHighlight(item.stock)}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {item.sku || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-bold ${
                        item.stock === 0
                          ? 'text-destructive'
                          : item.stock < 10
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-foreground'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon className="size-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.variantsCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.updatedAt ? fmt(item.updatedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setAdjustItem(item)}
                      >
                        تعديل المخزون
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="سجل الحركات"
                        onClick={() => setMovementsItem(item)}
                      >
                        <History className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Dialog */}
      {adjustItem && (
        <AdjustDialog
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={() => mutate()}
        />
      )}

      {/* Movements Dialog */}
      {movementsItem && (
        <MovementsDialog item={movementsItem} onClose={() => setMovementsItem(null)} />
      )}
    </div>
  )
}
