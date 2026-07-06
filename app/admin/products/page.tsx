'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, Package, ToggleLeft, ToggleRight, CheckCircle, XCircle, Plus } from 'lucide-react'
import { getAdminProducts, toggleAdminProduct, approveProductApi, rejectProductApi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import Image from 'next/image'

const EMPTY_PRODUCT = { name: '', nameAr: '', sku: '', stock: '0', active: true, supplierId: '', categoryId: '', imageUrl: '' }

type Product = Awaited<ReturnType<typeof getAdminProducts>>[number]

const STATUS_TABS = ['all', 'active', 'inactive', 'pending_approval', 'rejected'] as const
type Tab = (typeof STATUS_TABS)[number]

const APPROVAL_STATUS_COLOR: Record<string, string> = {
  approved:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending_approval:'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const APPROVAL_STATUS_LABEL: Record<string, string> = {
  approved:        'معتمد',
  pending_approval:'قيد المراجعة',
  rejected:        'مرفوض',
}

export default function AdminProductsPage() {
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('admin/products', getAdminProducts)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [toggling, setToggling] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [createDialog, setCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ ...EMPTY_PRODUCT })
  const [creating, setCreating] = useState(false)

  async function toggle(p: Product) {
    setToggling(p.id)
    try {
      await toggleAdminProduct(p.id, !p.active)
      await mutate()
      success(p.active ? 'تم تعطيل المنتج' : 'تم تفعيل المنتج')
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setToggling(null)
    }
  }

  async function approve(id: string) {
    setToggling(id)
    try {
      await approveProductApi(id)
      await mutate()
      success('تمت الموافقة على المنتج')
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setToggling(null)
    }
  }

  async function confirmReject() {
    if (!rejectId || !rejectReason.trim()) return
    setToggling(rejectId)
    try {
      await rejectProductApi(rejectId, rejectReason.trim())
      await mutate()
      setRejectId(null)
      setRejectReason('')
      success('تم رفض المنتج')
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setToggling(null)
    }
  }

  async function handleCreate() {
    if (!createForm.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          nameAr: createForm.nameAr || null,
          sku: createForm.sku || null,
          stock: Number(createForm.stock || 0),
          active: createForm.active,
          supplierId: createForm.supplierId || null,
          categoryId: createForm.categoryId || null,
          imageUrl: createForm.imageUrl || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCreateDialog(false)
      setCreateForm({ ...EMPTY_PRODUCT })
      await mutate()
      success('تم إضافة المنتج بنجاح')
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : t('toastSaveFailed'))
    } finally {
      setCreating(false)
    }
  }

  const TAB_LABEL: Record<Tab, string> = {
    all:             t('filterAll'),
    active:          t('enabledLabel'),
    inactive:        'معطّل',
    pending_approval:'قيد المراجعة',
    rejected:        'مرفوض',
  }

  return (
    <div className="route-fade space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-9 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => { setCreateForm({ ...EMPTY_PRODUCT }); setCreateDialog(true) }}>
          <Plus className="size-4" />
          إضافة منتج
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={Package} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(products) => {
          const filtered = products.filter((p) => {
            const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(q.toLowerCase())
            const pStatus = (p as unknown as { status?: string }).status ?? 'approved'
            const matchTab =
              tab === 'all'
              || (tab === 'active' ? p.active : false)
              || (tab === 'inactive' ? !p.active : false)
              || (tab === 'pending_approval' ? pStatus === 'pending_approval' : false)
              || (tab === 'rejected' ? pStatus === 'rejected' : false)
            return matchQ && matchTab
          })

          return (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  {filtered.length} منتج
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-start font-medium">المنتج</th>
                      <th className="px-4 py-3 text-start font-medium">SKU</th>
                      <th className="px-4 py-3 text-start font-medium">المخزون</th>
                      <th className="px-4 py-3 text-start font-medium">الحالة</th>
                      <th className="px-4 py-3 text-start font-medium">تاريخ الإضافة</th>
                      <th className="px-4 py-3 text-start font-medium">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {p.imageUrl ? (
                                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="40px" />
                              ) : (
                                <Package className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground max-w-[200px]">{p.name}</p>
                              {p.nameAr && p.nameAr !== p.name && (
                                <p className="truncate text-xs text-muted-foreground max-w-[200px]">{p.nameAr}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.stock <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {p.active ? t('enabledLabel') : 'معطّل'}
                            </span>
                            {(() => {
                              const pStatus = (p as unknown as { status?: string }).status ?? 'approved'
                              return pStatus !== 'approved' ? (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${APPROVAL_STATUS_COLOR[pStatus] ?? ''}`}>
                                  {APPROVAL_STATUS_LABEL[pStatus] ?? pStatus}
                                </span>
                              ) : null
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {(() => {
                              const pStatus = (p as unknown as { status?: string }).status ?? 'approved'
                              return pStatus === 'pending_approval' ? (
                                <>
                                  <button
                                    onClick={() => approve(p.id)}
                                    disabled={toggling === p.id}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 disabled:opacity-50 transition-colors"
                                  >
                                    <CheckCircle className="size-3.5" /> موافقة
                                  </button>
                                  <button
                                    onClick={() => { setRejectId(p.id); setRejectReason('') }}
                                    disabled={toggling === p.id}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
                                  >
                                    <XCircle className="size-3.5" /> رفض
                                  </button>
                                </>
                              ) : null
                            })()}
                            <button
                              onClick={() => toggle(p)}
                              disabled={toggling === p.id}
                              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                              title={p.active ? 'تعطيل' : 'تفعيل'}
                            >
                              {p.active
                                ? <ToggleRight className="size-4 text-success" />
                                : <ToggleLeft className="size-4 text-muted-foreground" />
                              }
                              {p.active ? 'تعطيل' : 'تفعيل'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          لا توجد منتجات
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }}
      </AsyncContent>

      {/* Reject Dialog */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">سبب الرفض</h3>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="اكتب سبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectId(null); setRejectReason('') }}
                className="rounded-lg px-4 py-2 text-sm border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || toggling === rejectId}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                رفض المنتج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Dialog */}
      <Dialog open={createDialog} onOpenChange={(o) => !o && setCreateDialog(false)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>الاسم (عربي) *</Label>
              <Input value={createForm.nameAr} onChange={(e) => setCreateForm((f) => ({ ...f, nameAr: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>الاسم (إنجليزي) *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>SKU</Label>
                <Input value={createForm.sku} onChange={(e) => setCreateForm((f) => ({ ...f, sku: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>المخزون</Label>
                <Input type="number" value={createForm.stock} onChange={(e) => setCreateForm((f) => ({ ...f, stock: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>معرّف المورد (Supplier ID)</Label>
              <Input value={createForm.supplierId} onChange={(e) => setCreateForm((f) => ({ ...f, supplierId: e.target.value }))} dir="ltr" placeholder="اختياري" />
            </div>
            <div className="space-y-1">
              <Label>رابط الصورة</Label>
              <Input value={createForm.imageUrl} onChange={(e) => setCreateForm((f) => ({ ...f, imageUrl: e.target.value }))} dir="ltr" placeholder="https://…" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={createForm.active} onCheckedChange={(v) => setCreateForm((f) => ({ ...f, active: v }))} />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.name.trim()}>{creating ? 'جاري الحفظ…' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
