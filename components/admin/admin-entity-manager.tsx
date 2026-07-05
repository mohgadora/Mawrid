'use client'

import { useState, type ReactNode } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { useAdminCollection } from '@/lib/use-admin-collection'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type EntityField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'select' | 'textarea'
  options?: { value: string; label: string }[]
  required?: boolean
  dir?: 'ltr' | 'rtl'
}

export type EntityColumn<T> = {
  key: keyof T & string
  label: string
  render?: (row: T) => ReactNode
}

type Props<T extends { id: number }> = {
  storageKey: string
  initial: T[]
  columns: EntityColumn<T>[]
  fields: EntityField[]
  addLabel: string
  editLabel?: string
  emptyForm: Record<string, string | number>
  layout?: 'table' | 'cards'
  cardTitle?: (row: T) => string
  cardSubtitle?: (row: T) => string
}

export function AdminEntityManager<T extends { id: number }>({
  storageKey,
  initial,
  columns,
  fields,
  addLabel,
  editLabel,
  emptyForm,
  layout = 'table',
  cardTitle,
  cardSubtitle,
}: Props<T>) {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { items, add, update, remove, isLoading } = useAdminCollection<T>(storageKey, initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [toDelete, setToDelete] = useState<number | null>(null)
  const [form, setForm] = useState<Record<string, string | number>>(emptyForm)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  function openEdit(row: T) {
    setEditing(row)
    const next: Record<string, string | number> = {}
    for (const f of fields) {
      const v = row[f.key as keyof T]
      next[f.key] = typeof v === 'number' ? v : String(v ?? '')
    }
    setForm(next)
    setOpen(true)
  }

  async function save() {
    for (const f of fields) {
      if (f.required && !String(form[f.key] ?? '').trim()) return
    }
    const payload = { ...form } as Omit<T, 'id'>
    setSaving(true)
    try {
      if (editing) await update(editing.id, payload as Partial<T>)
      else await add(payload as Omit<T, 'id'>)
      setOpen(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setSaving(true)
    try {
      await remove(toDelete)
      setToDelete(null)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="route-fade space-y-5">
      {isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      )}
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd} disabled={isLoading || saving}>
          <Plus className="size-4" /> {addLabel}
        </Button>
      </div>

      {layout === 'table' ? (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-3 text-start font-medium">{c.label}</th>
                ))}
                <th className="px-5 py-3 text-start font-medium">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3 text-xs text-foreground">
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? '')}
                    </td>
                  ))}
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(row)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setToDelete(row.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{cardTitle?.(row)}</p>
              {cardSubtitle && <p className="mt-1 text-xs text-muted-foreground">{cardSubtitle(row)}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => openEdit(row)}>{editLabel ?? t('editProfile')}</Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => setToDelete(row.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? (editLabel ?? addLabel) : addLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto py-2">
            {fields.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">{f.label}</span>
                {f.type === 'select' ? (
                  <select
                    value={String(form[f.key] ?? '')}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={String(form[f.key] ?? '')}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    dir={f.dir}
                    value={String(form[f.key] ?? '')}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))}
                  />
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? t('saving') : t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t('deleteAddressConfirm')}
        description={t('deleteAddressConfirmDesc')}
        confirmLabel={t('deleteAddress')}
        cancelLabel={t('cancel')}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export function statusChip(value: string) {
  return <AdminStatusChip status={value} />
}
