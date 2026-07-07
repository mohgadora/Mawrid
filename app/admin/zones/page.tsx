'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, InboxIcon, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { getDeliveryZones, createZoneApi, updateZoneApi, deleteZoneApi,
         getZoneRulesApi, createZoneRuleApi, updateZoneRuleApi, deleteZoneRuleApi } from '@/lib/api-client'
import type { ShippingRuleRow } from '@/lib/api-client'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

type ZoneRow = Awaited<ReturnType<typeof getDeliveryZones>>[number]

const EMPTY_FORM = {
  name: '',
  city: '',
  fee: '0',
  minOrder: '0',
  active: true,
}

const EMPTY_RULE_FORM = {
  name: '',
  minOrderAmount: '0',
  maxOrderAmount: '',
  freeAbove: '',
  baseFee: '0',
  perKgFee: '0',
  estimatedDays: '3',
  active: true,
}

// ── Zone Rules Panel ─────────────────────────────────────────────────────────

function ZoneRulesPanel({ zone, formatPrice }: { zone: ZoneRow; formatPrice: (n: number) => string }) {
  const { success, error: toastError } = useToast()
  const { data: rules, isLoading, mutate } = useSWR<ShippingRuleRow[]>(
    `admin/zones/${zone.id}/rules`,
    () => getZoneRulesApi(zone.id),
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ShippingRuleRow | null>(null)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)

  function openAddRule() {
    setEditingRule(null)
    setRuleForm(EMPTY_RULE_FORM)
    setDialogOpen(true)
  }

  function openEditRule(r: ShippingRuleRow) {
    setEditingRule(r)
    setRuleForm({
      name: r.name,
      minOrderAmount: String(r.minOrderAmount),
      maxOrderAmount: r.maxOrderAmount !== null ? String(r.maxOrderAmount) : '',
      freeAbove: r.freeAbove !== null ? String(r.freeAbove) : '',
      baseFee: String(r.baseFee),
      perKgFee: String(r.perKgFee),
      estimatedDays: String(r.estimatedDays),
      active: r.active,
    })
    setDialogOpen(true)
  }

  async function saveRule() {
    if (!ruleForm.name.trim()) {
      toastError('اسم القاعدة مطلوب')
      return
    }
    setSaving(true)
    const payload = {
      name: ruleForm.name.trim(),
      minOrderAmount: Number(ruleForm.minOrderAmount) || 0,
      maxOrderAmount: ruleForm.maxOrderAmount ? Number(ruleForm.maxOrderAmount) : null,
      freeAbove: ruleForm.freeAbove ? Number(ruleForm.freeAbove) : null,
      baseFee: Number(ruleForm.baseFee) || 0,
      perKgFee: Number(ruleForm.perKgFee) || 0,
      estimatedDays: Number(ruleForm.estimatedDays) || 3,
      active: ruleForm.active,
    }
    try {
      if (editingRule) {
        await updateZoneRuleApi(zone.id, editingRule.id, payload)
      } else {
        await createZoneRuleApi(zone.id, payload)
      }
      await mutate()
      setDialogOpen(false)
      success('تم حفظ القاعدة')
    } catch {
      toastError('فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteRule() {
    if (!deleteRuleId) return
    try {
      await deleteZoneRuleApi(zone.id, deleteRuleId)
      await mutate()
      setDeleteRuleId(null)
      success('تم الحذف')
    } catch {
      toastError('فشل الحذف')
    }
  }

  return (
    <div className="border-t border-border/50 bg-muted/20 px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">قواعد الشحن</span>
        <Button size="sm" variant="outline" className="h-6 gap-1 text-xs" onClick={openAddRule}>
          <Plus className="size-3" /> إضافة قاعدة
        </Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">جارٍ التحميل…</p>}
      {rules && rules.length === 0 && (
        <p className="text-xs text-muted-foreground">لا توجد قواعد — يُستخدم الإعداد الافتراضي للمنطقة.</p>
      )}
      {rules && rules.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-start font-medium">الاسم</th>
              <th className="py-1 text-start font-medium">الحد الأدنى</th>
              <th className="py-1 text-start font-medium">الحد الأقصى</th>
              <th className="py-1 text-start font-medium">رسوم أساسية</th>
              <th className="py-1 text-start font-medium">مجاني فوق</th>
              <th className="py-1 text-start font-medium">مدة التوصيل</th>
              <th className="py-1 text-start font-medium">الحالة</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-border/30 hover:bg-muted/40">
                <td className="py-1.5 font-medium text-foreground">{r.name}</td>
                <td className="py-1.5 text-muted-foreground">{formatPrice(r.minOrderAmount)}</td>
                <td className="py-1.5 text-muted-foreground">
                  {r.maxOrderAmount !== null ? formatPrice(r.maxOrderAmount) : '—'}
                </td>
                <td className="py-1.5 text-foreground">{formatPrice(r.baseFee)}</td>
                <td className="py-1.5 text-foreground">
                  {r.freeAbove !== null ? formatPrice(r.freeAbove) : '—'}
                </td>
                <td className="py-1.5 text-muted-foreground">{r.estimatedDays} أيام</td>
                <td className="py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {r.active ? 'نشط' : 'معطّل'}
                  </span>
                </td>
                <td className="py-1.5">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditRule(r)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive" onClick={() => setDeleteRuleId(r.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Rule dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'تعديل قاعدة الشحن' : 'إضافة قاعدة شحن'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <label className="col-span-2 flex flex-col gap-1.5 text-sm">
              <span className="font-medium">الاسم</span>
              <Input value={ruleForm.name} onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">الحد الأدنى للطلب (ر.س)</span>
              <Input type="number" min={0} dir="ltr" value={ruleForm.minOrderAmount} onChange={(e) => setRuleForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">الحد الأقصى (اختياري)</span>
              <Input type="number" min={0} dir="ltr" value={ruleForm.maxOrderAmount} onChange={(e) => setRuleForm((f) => ({ ...f, maxOrderAmount: e.target.value }))} placeholder="بلا حد" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">الرسوم الأساسية (ر.س)</span>
              <Input type="number" min={0} dir="ltr" value={ruleForm.baseFee} onChange={(e) => setRuleForm((f) => ({ ...f, baseFee: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">رسوم لكل كجم (ر.س)</span>
              <Input type="number" min={0} dir="ltr" value={ruleForm.perKgFee} onChange={(e) => setRuleForm((f) => ({ ...f, perKgFee: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">شحن مجاني فوق (ر.س)</span>
              <Input type="number" min={0} dir="ltr" value={ruleForm.freeAbove} onChange={(e) => setRuleForm((f) => ({ ...f, freeAbove: e.target.value }))} placeholder="غير مفعّل" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">مدة التوصيل (أيام)</span>
              <Input type="number" min={1} dir="ltr" value={ruleForm.estimatedDays} onChange={(e) => setRuleForm((f) => ({ ...f, estimatedDays: e.target.value }))} />
            </label>
            <label className="col-span-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">نشط</span>
              <Switch checked={ruleForm.active} onCheckedChange={(v) => setRuleForm((f) => ({ ...f, active: v }))} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={saveRule} disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteRuleId !== null}
        onOpenChange={(o) => !o && setDeleteRuleId(null)}
        title="حذف القاعدة؟"
        description="سيتم حذف قاعدة الشحن نهائياً."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={confirmDeleteRule}
      />
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ZonesPage() {
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<ZoneRow[]>('admin/zones', getDeliveryZones)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ZoneRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(zone: ZoneRow) {
    setEditing(zone)
    setForm({
      name: zone.name,
      city: zone.city,
      fee: String(zone.fee),
      minOrder: String(zone.minOrder),
      active: zone.status === 'active',
    })
    setDialogOpen(true)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function save() {
    if (!form.name.trim() || !form.city.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      fee: Number(form.fee) || 0,
      minOrder: Number(form.minOrder) || 0,
      active: form.active,
      status: form.active ? 'active' : 'inactive',
    }

    try {
      if (editing) {
        await updateZoneApi(editing.id, payload)
      } else {
        await createZoneApi(payload)
      }
      await mutate()
      setDialogOpen(false)
      success(t('toastZoneSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteZone() {
    if (!deleteZoneId) return
    try {
      await deleteZoneApi(deleteZoneId)
      await mutate()
      setDeleteZoneId(null)
      success('تم حذف المنطقة')
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <div className="route-fade space-y-5">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="size-4" /> {t('addZone')}
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
        {(zones) => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-5 py-3 text-start font-medium">{t('zoneName')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('zoneCity')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('deliveryFee')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('minOrder')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('statusLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('actionLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <React.Fragment key={z.id}>
                    <tr
                      className="border-b border-border/50 transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleExpand(z.id)}
                    >
                      <td className="px-3 py-3 text-muted-foreground">
                        {expandedId === z.id
                          ? <ChevronDown className="size-4" />
                          : <ChevronRight className="size-4" />
                        }
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">{z.name}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{z.city}</td>
                      <td className="px-5 py-3 text-xs text-foreground">{formatPrice(z.fee)}</td>
                      <td className="px-5 py-3 text-xs text-foreground">{formatPrice(z.minOrder)}</td>
                      <td className="px-5 py-3"><AdminStatusChip status={z.status} /></td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(z)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                            onClick={() => setDeleteZoneId(z.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === z.id && (
                      <tr key={`${z.id}-rules`}>
                        <td colSpan={7} className="p-0">
                          <ZoneRulesPanel zone={z} formatPrice={formatPrice} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

      {/* Zone create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('editZone') : t('addZone')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('zoneName')}</span>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('zoneCity')}</span>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('deliveryFee')}</span>
              <Input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                dir="ltr"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('minOrder')}</span>
              <Input
                type="number"
                min={0}
                value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                dir="ltr"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{t('enabledLabel')}</span>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? t('saving') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteZoneId !== null}
        onOpenChange={(o) => !o && setDeleteZoneId(null)}
        title="حذف المنطقة؟"
        description="سيتم حذف المنطقة وجميع قواعد الشحن المرتبطة بها."
        confirmLabel="حذف"
        cancelLabel={t('cancel')}
        onConfirm={confirmDeleteZone}
      />
    </div>
  )
}
