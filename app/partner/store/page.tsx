'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetchPartnerDashboard, updatePartnerStoreApi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function PartnerStorePage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('partner/dashboard', fetchPartnerDashboard)
  const [form, setForm] = useState({ name: '', nameEn: '', city: '', country: 'SA', logo: '', minOrder: '1', responseTime: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data?.store) {
      setForm({
        name: data.store.name,
        nameEn: data.store.nameEn ?? data.store.name,
        city: data.store.city ?? '',
        country: data.store.country ?? 'SA',
        logo: data.store.logo ?? '',
        minOrder: String(data.store.minOrder ?? 1),
        responseTime: data.store.responseTime ?? '',
      })
    }
  }, [data])

  async function save() {
    setSaving(true)
    try {
      await updatePartnerStoreApi({
        name: form.name,
        nameEn: form.nameEn,
        city: form.city,
        country: form.country,
        logo: form.logo,
        minOrder: Number(form.minOrder),
        responseTime: form.responseTime,
      })
      await mutate()
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AsyncContent data={data} error={error} isLoading={isLoading} onRetry={() => mutate()}>
      {(dash) => (
        <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t('partnerNavStore')}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dash.store.verified ? 'bg-primary/10 text-primary' : 'bg-yellow-500/10 text-yellow-600'}`}>
              {dash.store.verified ? t('partnerVerified') : t('partnerPendingVerification')}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('nameLabel')} />
            <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} placeholder={`${t('nameLabel')} (EN)`} dir="ltr" />
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder={t('city')} />
            <Input value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder={t('imageUrl')} dir="ltr" />
            <Input type="number" min={1} value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} placeholder={t('minOrder')} dir="ltr" />
            <Input value={form.responseTime} onChange={(e) => setForm((f) => ({ ...f, responseTime: e.target.value }))} placeholder={t('partnerResponseTime')} />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">{saving ? t('saving') : t('saveChanges')}</Button>
        </div>
      )}
    </AsyncContent>
  )
}
