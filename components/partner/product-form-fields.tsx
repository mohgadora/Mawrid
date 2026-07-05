'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'
import { fetchPartnerCategories } from '@/lib/api-client'

export type ProductFormData = {
  name: string
  nameEn: string
  description: string
  sku: string
  stock: string
  price: string
  image: string
  unitsPerCarton: string
  categoryId: string
  active: boolean
}

export const EMPTY_PRODUCT: ProductFormData = {
  name: '',
  nameEn: '',
  description: '',
  sku: '',
  stock: '0',
  price: '0',
  image: '/placeholder.png',
  unitsPerCarton: '1',
  categoryId: '',
  active: true,
}

type Props = {
  form: ProductFormData
  onChange: (next: ProductFormData) => void
}

export function PartnerProductFields({ form, onChange }: Props) {
  const { t } = useI18n()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchPartnerCategories().then(setCategories).catch(() => {})
  }, [])

  const set = (key: keyof ProductFormData, value: string | boolean) =>
    onChange({ ...form, [key]: value })

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder={t('nameLabel')} value={form.name} onChange={(e) => set('name', e.target.value)} required />
      <Input placeholder={`${t('nameLabel')} (EN)`} value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} dir="ltr" />
      <textarea
        placeholder={t('description')}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} dir="ltr" />
        <Input type="number" min={0} placeholder={t('stock')} value={form.stock} onChange={(e) => set('stock', e.target.value)} dir="ltr" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input type="number" min={0} step="0.01" placeholder={t('price')} value={form.price} onChange={(e) => set('price', e.target.value)} dir="ltr" />
        <Input type="number" min={1} placeholder={t('cartons')} value={form.unitsPerCarton} onChange={(e) => set('unitsPerCarton', e.target.value)} dir="ltr" />
      </div>
      <Input placeholder={t('imageUrl')} value={form.image} onChange={(e) => set('image', e.target.value)} dir="ltr" />
      <select
        value={form.categoryId}
        onChange={(e) => set('categoryId', e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">{t('category')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
        {t('enabledLabel')}
      </label>
    </div>
  )
}
