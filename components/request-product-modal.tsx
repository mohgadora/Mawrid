'use client'

import { useState } from 'react'
import { X, PackageSearch, CheckCircle2, ChevronDown } from 'lucide-react'
import { CATEGORIES, flattenCategories } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

type FormState = {
  productName: string
  categorySlug: string
  description: string
  quantity: string
}

const EMPTY: FormState = { productName: '', categorySlug: '', description: '', quantity: '' }

export function RequestProductModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Flatten the full tree so every leaf category appears in the dropdown
  const allCats = flattenCategories(CATEGORIES)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productName.trim()) return
    setLoading(true)
    // Simulate async submit
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
    toast(t('requestProductSuccess'))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('requestProductTitle')}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-card sm:rounded-2xl shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <PackageSearch className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">{t('requestProductTitle')}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('requestProductSubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-8" />
              </span>
              <div>
                <p className="text-lg font-bold text-foreground">{t('requestProductSuccess')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('requestProductSuccessDesc')}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setForm(EMPTY); setSubmitted(false) }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {t('requestAnotherProduct')}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Product name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rp-name" className="text-sm font-medium text-foreground">
                  {t('requestProductName')} <span className="text-destructive">*</span>
                </label>
                <input
                  id="rp-name"
                  type="text"
                  required
                  value={form.productName}
                  onChange={(e) => set('productName', e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أرز بسمتي 25 كجم' : 'e.g. Basmati rice 25kg'}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rp-cat" className="text-sm font-medium text-foreground">
                  {t('requestProductCategory')}
                </label>
                <div className="relative">
                  <select
                    id="rp-cat"
                    value={form.categorySlug}
                    onChange={(e) => set('categorySlug', e.target.value)}
                    className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('selectCategory')}</option>
                    {allCats.map((c) => {
                      const depth = c.parentSlug ? (allCats.find(p => p.slug === c.parentSlug)?.parentSlug ? 2 : 1) : 0
                      const prefix = '\u00A0'.repeat(depth * 3)
                      const name = lang === 'ar' ? c.nameAr : c.nameEn
                      return (
                        <option key={c.slug} value={c.slug}>
                          {prefix}{name}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rp-qty" className="text-sm font-medium text-foreground">
                  {t('requestProductQty')}
                </label>
                <input
                  id="rp-qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  placeholder="10"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rp-desc" className="text-sm font-medium text-foreground">
                  {t('requestProductDesc')}
                  <span className="ms-1 text-xs text-muted-foreground">({t('optional')})</span>
                </label>
                <textarea
                  id="rp-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder={lang === 'ar' ? 'أي تفاصيل إضافية عن المنتج...' : 'Any additional product details...'}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.productName.trim()}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? t('saving') : t('requestProductSubmit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
