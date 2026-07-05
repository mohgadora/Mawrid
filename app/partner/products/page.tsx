'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  fetchPartnerProducts,
  savePartnerProductApi,
  deletePartnerProductApi,
  updatePartnerProductApi,
} from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PartnerProductFields, EMPTY_PRODUCT, type ProductFormData } from '@/components/partner/product-form-fields'

type Product = Awaited<ReturnType<typeof fetchPartnerProducts>>[number]

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending_approval: { label: 'قيد المراجعة', icon: Clock,         className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved:         { label: 'معتمد',         icon: CheckCircle,   className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected:         { label: 'مرفوض',         icon: XCircle,       className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function PartnerProductsPage() {
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('partner/products', fetchPartnerProducts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormData>(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
    setDialogOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      nameEn: p.nameEn,
      description: p.description ?? '',
      descriptionEn: (p as unknown as { descriptionEn?: string }).descriptionEn ?? '',
      sku: p.sku,
      stock: String(p.stock),
      price: String(p.price),
      image: p.image,
      unitsPerCarton: String(p.unitsPerCarton ?? 1),
      categoryId: p.categoryId ?? '',
      active: p.active,
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }
    setSaving(true)
    try {
      await savePartnerProductApi(editing?.id ?? null, {
        name: form.name,
        nameEn: form.nameEn || form.name,
        description: form.description,
        descriptionEn: form.descriptionEn,
        sku: form.sku,
        stock: Number(form.stock),
        price: Number(form.price),
        image: form.image,
        unitsPerCarton: Number(form.unitsPerCarton),
        categoryId: form.categoryId || undefined,
        active: form.active,
      })
      await mutate()
      setDialogOpen(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await updatePartnerProductApi(id, !active)
      await mutate()
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await deletePartnerProductApi(toDelete)
      await mutate()
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="size-4" /> {t('partnerAddProduct')}
        </Button>
      </div>

      <AsyncContent data={data} error={error} isLoading={isLoading} loading={<AdminPageSkeleton rows={8} cards={0} />} onRetry={() => mutate()}>
        {(products) => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{t('nameLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">SKU</th>
                  <th className="px-4 py-3 text-start font-medium">{t('price')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('stock')}</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">{t('enabledLabel')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('actionLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="relative size-8 overflow-hidden rounded bg-muted">
                          <Image src={p.image || '/placeholder.png'} alt="" fill className="object-cover" sizes="32px" />
                        </span>
                        <span className="text-xs font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-xs">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-xs">{p.stock}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const pStatus = (p as unknown as { status?: string }).status ?? 'approved'
                        const rejectionReason = (p as unknown as { rejectionReason?: string | null }).rejectionReason
                        const cfg = STATUS_CONFIG[pStatus]
                        if (!cfg) return <span className="text-xs text-muted-foreground">{pStatus}</span>
                        const Icon = cfg.icon
                        return (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                              <Icon className="size-3" />
                              {cfg.label}
                            </span>
                            {pStatus === 'rejected' && rejectionReason && (
                              <p className="text-[10px] text-destructive max-w-[160px] leading-snug">{rejectionReason}</p>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3"><Switch checked={p.active} onCheckedChange={() => toggleActive(p.id, p.active)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setToDelete(p.id)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('partnerEditProduct') : t('partnerAddProduct')}</DialogTitle>
          </DialogHeader>
          <PartnerProductFields form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t('cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t('saving') : t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t('partnerDeleteProduct')}
        description={t('deleteAddressConfirmDesc')}
        confirmLabel={t('deleteAddress')}
        cancelLabel={t('cancel')}
        onConfirm={confirmDelete}
      />
    </>
  )
}
