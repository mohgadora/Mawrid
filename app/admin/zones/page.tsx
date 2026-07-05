'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, InboxIcon } from 'lucide-react'
import { getDeliveryZones, createZoneApi, updateZoneApi } from '@/lib/api-client'
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

type ZoneRow = Awaited<ReturnType<typeof getDeliveryZones>>[number]

const EMPTY_FORM = {
  name: '',
  city: '',
  fee: '0',
  minOrder: '0',
  active: true,
}

export default function ZonesPage() {
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<ZoneRow[]>('admin/zones', getDeliveryZones)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ZoneRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

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
                  <tr key={z.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 text-xs font-semibold text-foreground">{z.name}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{z.city}</td>
                    <td className="px-5 py-3 text-xs text-foreground">{formatPrice(z.fee)}</td>
                    <td className="px-5 py-3 text-xs text-foreground">{formatPrice(z.minOrder)}</td>
                    <td className="px-5 py-3"><AdminStatusChip status={z.status} /></td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(z)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

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
    </div>
  )
}
