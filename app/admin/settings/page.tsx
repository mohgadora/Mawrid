'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Settings, Store, CreditCard, Briefcase, Loader2, Save } from 'lucide-react'
import { getAdminSettings, updateAdminSettings } from '@/lib/api-client'
import type { SystemSettings } from '@/lib/api-client'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/lib/toast'
import { useI18n } from '@/lib/i18n'

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function SettingsForm({ initial, onSave }: { initial: SystemSettings; onSave: (s: SystemSettings) => Promise<void> }) {
  const [s, setS] = useState<SystemSettings>(initial)
  const [saving, setSaving] = useState(false)
  const { success, error: toastError } = useToast()
  const { t } = useI18n()

  function set<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await onSave(s)
      success(t('toastProfileSaved'))
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('adminSettings')}</h1>
          <p className="text-sm text-muted-foreground">إعدادات المنصة المركزية</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span className="ms-2">حفظ الإعدادات</span>
        </Button>
      </div>

      {/* ── General ─────────────────────────────────────────── */}
      <SectionCard icon={Store} title="إعدادات المتجر">
        <SettingRow label="اسم المتجر">
          <Input className="w-56" value={s.storeName} onChange={(e) => set('storeName', e.target.value)} />
        </SettingRow>
        <SettingRow label="رابط الشعار" description="URL لصورة الشعار">
          <Input className="w-64" value={s.storeLogo} placeholder="https://..." onChange={(e) => set('storeLogo', e.target.value)} />
        </SettingRow>
        <SettingRow label="Favicon" description="URL للـ favicon">
          <Input className="w-64" value={s.favicon} placeholder="https://..." onChange={(e) => set('favicon', e.target.value)} />
        </SettingRow>
        <SettingRow label="العملة الافتراضية">
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={s.defaultCurrency} onChange={(e) => set('defaultCurrency', e.target.value)}>
            {['SAR', 'AED', 'KWD', 'USD', 'EGP'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="اللغة الافتراضية">
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={s.defaultLanguage} onChange={(e) => set('defaultLanguage', e.target.value)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </SettingRow>
        <SettingRow label="وضع الصيانة" description="يوقف المتجر للزوار مؤقتاً">
          <Switch checked={s.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} />
        </SettingRow>
      </SectionCard>

      {/* ── Business Mode ──────────────────────────────────── */}
      <SectionCard icon={Briefcase} title="إعدادات الأعمال">
        <SettingRow label="نموذج العمل">
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={s.businessMode} onChange={(e) => set('businessMode', e.target.value as SystemSettings['businessMode'])}>
            <option value="single_vendor">بائع واحد (Single Vendor)</option>
            <option value="multi_vendor">متعدد البائعين (Multi Vendor)</option>
          </select>
        </SettingRow>
        <SettingRow label="مسؤولية الشحن">
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={s.shippingResponsibility} onChange={(e) => set('shippingResponsibility', e.target.value as SystemSettings['shippingResponsibility'])}>
            <option value="in_house">المنصة (In-house)</option>
            <option value="seller_wise">البائع (Seller-wise)</option>
            <option value="mixed">مختلط (Mixed)</option>
          </select>
        </SettingRow>
        <SettingRow label="نسبة العمولة الافتراضية %" description="تُطبق على البائعين الجدد">
          <Input className="w-28" type="number" min={0} max={100} step={0.5} value={s.defaultCommissionRate} onChange={(e) => set('defaultCommissionRate', Number(e.target.value))} />
        </SettingRow>
        <SettingRow label="تسجيل البائعين" description="السماح للبائعين الجدد بالتسجيل">
          <Switch checked={s.sellerRegistrationEnabled} onCheckedChange={(v) => set('sellerRegistrationEnabled', v)} />
        </SettingRow>
        <SettingRow label="موافقة المنتجات" description="تتطلب موافقة الأدمن قبل نشر منتجات البائعين">
          <Switch checked={s.productApprovalRequired} onCheckedChange={(v) => set('productApprovalRequired', v)} />
        </SettingRow>
        <SettingRow label="الدفع كضيف" description="السماح بالطلب بدون حساب">
          <Switch checked={s.guestCheckoutEnabled} onCheckedChange={(v) => set('guestCheckoutEnabled', v)} />
        </SettingRow>
      </SectionCard>

      {/* ── Payments ───────────────────────────────────────── */}
      <SectionCard icon={CreditCard} title="إعدادات الدفع والضرائب">
        <SettingRow label="الدفع عند الاستلام (COD)">
          <Switch checked={s.codEnabled} onCheckedChange={(v) => set('codEnabled', v)} />
        </SettingRow>
        <SettingRow label="التحويل البنكي">
          <Switch checked={s.bankTransferEnabled} onCheckedChange={(v) => set('bankTransferEnabled', v)} />
        </SettingRow>
        <SettingRow label="الدفع الإلكتروني">
          <Switch checked={s.onlinePaymentEnabled} onCheckedChange={(v) => set('onlinePaymentEnabled', v)} />
        </SettingRow>
        <SettingRow label="تفعيل الضريبة">
          <Switch checked={s.taxEnabled} onCheckedChange={(v) => set('taxEnabled', v)} />
        </SettingRow>
        {s.taxEnabled && (
          <SettingRow label="نسبة الضريبة %">
            <Input className="w-28" type="number" min={0} max={100} step={0.5} value={s.taxPercentage} onChange={(e) => set('taxPercentage', Number(e.target.value))} />
          </SettingRow>
        )}
      </SectionCard>

      {/* ── Refund & Stock ─────────────────────────────────── */}
      <SectionCard icon={Settings} title="إعدادات الاسترجاع والمخزون">
        <SettingRow label="تفعيل الاسترجاع">
          <Switch checked={s.refundEnabled} onCheckedChange={(v) => set('refundEnabled', v)} />
        </SettingRow>
        {s.refundEnabled && (
          <SettingRow label="مدة الاسترجاع (أيام)" description="المدة المسموح بها لطلب الاسترجاع بعد التسليم">
            <Input className="w-28" type="number" min={1} max={365} value={s.refundAllowedDays} onChange={(e) => set('refundAllowedDays', Number(e.target.value))} />
          </SettingRow>
        )}
        <SettingRow label="حد تنبيه المخزون المنخفض" description="القيمة الافتراضية للمنتجات الجديدة">
          <Input className="w-28" type="number" min={0} value={s.minStockWarning} onChange={(e) => set('minStockWarning', Number(e.target.value))} />
        </SettingRow>
      </SectionCard>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { data, error, isLoading, mutate } = useSWR('admin/settings', getAdminSettings)

  if (isLoading) return <AdminPageSkeleton cards={0} rows={8} />
  if (error || !data) return <div className="py-16 text-center text-muted-foreground">تعذّر تحميل الإعدادات</div>

  async function handleSave(s: SystemSettings) {
    const updated = await updateAdminSettings(s)
    await mutate(updated, false)
  }

  return <SettingsForm initial={data} onSave={handleSave} />
}
