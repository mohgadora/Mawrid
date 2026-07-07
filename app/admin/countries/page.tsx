'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Pencil, InboxIcon, Plus } from 'lucide-react'
import {
  getAdminCountries,
  createCountryApi,
  updateCountryApi,
} from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CountryRow = Awaited<ReturnType<typeof getAdminCountries>>[number]

const EMPTY_FORM = {
  code: '',
  name: '',
  nameEn: '',
  currency: 'SAR',
  enabled: true,
}

export default function CountriesPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<CountryRow[]>('admin/countries', getAdminCountries)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CountryRow | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(country: CountryRow) {
    setEditing(country)
    setForm({
      code: country.code,
      name: country.name,
      nameEn: country.nameEn,
      currency: country.currency,
      enabled: country.enabled,
    })
    setDialogOpen(true)
  }

  async function toggle(code: string, enabled: boolean) {
    setToggling(code)
    try {
      await updateCountryApi(code, { enabled: !enabled })
      await mutate()
      success(t('toastCountrySaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setToggling(null)
    }
  }

  async function save() {
    if (!form.name.trim() || !form.nameEn.trim() || !form.currency.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }
    if (!editing && (!form.code.trim() || form.code.trim().length < 2)) {
      toastError(t('toastRequiredFields'))
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await updateCountryApi(editing.code, {
          name: form.name,
          nameEn: form.nameEn,
          currency: form.currency,
          enabled: form.enabled,
        })
      } else {
        await createCountryApi({
          code: form.code.toUpperCase(),
          name: form.name,
          nameEn: form.nameEn,
          currency: form.currency.toUpperCase(),
          active: form.enabled,
        })
      }
      await mutate()
      setDialogOpen(false)
      success(t('toastCountrySaved'))
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
          <Plus className="size-4" /> {t('addCountry')}
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
        {(countries) => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">{t('countryName')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('currency')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('vat')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('languages')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('enabledLabel')}</th>
                  <th className="px-5 py-3 text-start font-medium">{t('actionLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.code} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 text-xs font-semibold text-foreground">{c.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.currency}</td>
                    <td className="px-5 py-3 text-xs text-foreground">{c.vat || '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{c.languages.join(' / ')}</td>
                    <td className="px-5 py-3">
                      <Switch
                        checked={c.enabled}
                        disabled={toggling === c.code}
                        onCheckedChange={() => toggle(c.code, c.enabled)}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(c)}
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
            <DialogTitle>{editing ? t('editCountry') : t('addCountry')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {!editing && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">{t('countryCode')}</span>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SA"
                  maxLength={4}
                  dir="ltr"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('countryName')}</span>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('nameLabel')} (EN)</span>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                dir="ltr"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t('currency')}</span>
              <Input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                placeholder="SAR"
                maxLength={3}
                dir="ltr"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{t('enabledLabel')}</span>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
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
