'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePartnerStoreApi, fetchPartnerDashboard } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 – Account Info
  company: string
  phone: string
  // Step 2 – Store Info
  name: string
  nameEn: string
  city: string
  country: string
  logo: string
  banner: string
  description: string
  // Step 3 – Policies
  shippingPolicy: string
  returnPolicy: string
  minOrder: string
  // Step 4 – Payout
  bankName: string
  iban: string
}

const INITIAL: FormData = {
  company: '',
  phone: '',
  name: '',
  nameEn: '',
  city: '',
  country: 'SA',
  logo: '',
  banner: '',
  description: '',
  shippingPolicy: '',
  returnPolicy: '',
  minOrder: '1',
  bankName: '',
  iban: '',
}

const STEPS = [
  'بيانات الحساب',
  'بيانات المتجر',
  'سياسات المتجر',
  'بيانات التوصيل',
  'مراجعة وإرسال',
]

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8" dir="ltr">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : active
                  ? 'border-2 border-primary text-primary'
                  : 'border-2 border-border text-muted-foreground'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={`h-0.5 w-10 transition-colors ${done ? 'bg-primary' : 'bg-border'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="اسم الشركة">
        <Input
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
          placeholder="مثال: شركة النور للتجارة"
        />
      </Field>
      <Field label="رقم الجوال">
        <Input
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+966 5x xxx xxxx"
          dir="ltr"
        />
      </Field>
    </div>
  )
}

function Step2({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="اسم المتجر (عربي)">
        <Input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="مثال: متجر النور"
        />
      </Field>
      <Field label="اسم المتجر (إنجليزي)">
        <Input
          value={form.nameEn}
          onChange={(e) => set('nameEn', e.target.value)}
          placeholder="e.g. Al-Noor Store"
          dir="ltr"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="المدينة">
          <Input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="الرياض"
          />
        </Field>
        <Field label="الدولة">
          <Input
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="SA"
            dir="ltr"
          />
        </Field>
      </div>
      <Field label="رابط الشعار (Logo URL)">
        <Input
          value={form.logo}
          onChange={(e) => set('logo', e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      </Field>
      <Field label="رابط البانر (Banner URL)">
        <Input
          value={form.banner}
          onChange={(e) => set('banner', e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      </Field>
      <Field label="وصف المتجر">
        <Textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="اكتب نبذة مختصرة عن متجرك..."
          rows={3}
        />
      </Field>
    </div>
  )
}

function Step3({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="سياسة الشحن">
        <Textarea
          value={form.shippingPolicy}
          onChange={(e) => set('shippingPolicy', e.target.value)}
          placeholder="أوضح مواعيد الشحن وطرق التوصيل..."
          rows={3}
        />
      </Field>
      <Field label="سياسة الإرجاع">
        <Textarea
          value={form.returnPolicy}
          onChange={(e) => set('returnPolicy', e.target.value)}
          placeholder="أوضح شروط الإرجاع والاستبدال..."
          rows={3}
        />
      </Field>
      <Field label="الحد الأدنى للطلب (ريال)">
        <Input
          type="number"
          min={1}
          value={form.minOrder}
          onChange={(e) => set('minOrder', e.target.value)}
          placeholder="1"
          dir="ltr"
        />
      </Field>
    </div>
  )
}

function Step4({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        تُستخدم هذه البيانات لتحويل أرباحك إلى حسابك البنكي.
      </p>
      <Field label="اسم البنك">
        <Input
          value={form.bankName}
          onChange={(e) => set('bankName', e.target.value)}
          placeholder="مثال: البنك الأهلي"
        />
      </Field>
      <Field label="رقم IBAN">
        <Input
          value={form.iban}
          onChange={(e) => set('iban', e.target.value)}
          placeholder="SA00 0000 0000 0000 0000 0000"
          dir="ltr"
        />
      </Field>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-left break-all" dir="auto">{value}</span>
    </div>
  )
}

function Step5({ form }: { form: FormData }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground mb-4">راجع بياناتك قبل الإرسال:</p>
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-2">
        <p className="text-xs font-semibold text-muted-foreground pt-2 pb-1">بيانات الحساب</p>
        <ReviewRow label="اسم الشركة" value={form.company} />
        <ReviewRow label="الجوال" value={form.phone} />
        <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">بيانات المتجر</p>
        <ReviewRow label="اسم المتجر (ع)" value={form.name} />
        <ReviewRow label="اسم المتجر (EN)" value={form.nameEn} />
        <ReviewRow label="المدينة" value={form.city} />
        <ReviewRow label="الدولة" value={form.country} />
        <ReviewRow label="وصف" value={form.description} />
        <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">السياسات</p>
        <ReviewRow label="سياسة الشحن" value={form.shippingPolicy} />
        <ReviewRow label="سياسة الإرجاع" value={form.returnPolicy} />
        <ReviewRow label="الحد الأدنى للطلب" value={form.minOrder ? `${form.minOrder} ريال` : ''} />
        <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">بيانات التوصيل</p>
        <ReviewRow label="البنك" value={form.bankName} />
        <ReviewRow label="IBAN" value={form.iban} />
      </div>
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(step: number, form: FormData): string | null {
  if (step === 0 && !form.company.trim()) return 'يرجى إدخال اسم الشركة'
  if (step === 1 && !form.name.trim()) return 'يرجى إدخال اسم المتجر بالعربي'
  if (step === 1 && !form.nameEn.trim()) return 'يرجى إدخال اسم المتجر بالإنجليزي'
  if (step === 3 && !form.bankName.trim()) return 'يرجى إدخال اسم البنك'
  if (step === 3 && !form.iban.trim()) return 'يرجى إدخال رقم IBAN'
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerOnboardingPage() {
  const router = useRouter()
  const { success, error: toastError, info } = useToast()
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Check if already onboarded
  useEffect(() => {
    fetchPartnerDashboard()
      .then((dash) => {
        if (dash?.store?.verified) {
          success('متجرك معتمد بالفعل')
          router.replace('/partner')
        } else if (dash?.store) {
          info('طلبك قيد المراجعة')
          router.replace('/partner')
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        // Not onboarded yet — show the form
        setChecking(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    const err = validate(step, form)
    if (err) { toastError(err); return }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    const err = validate(step, form)
    if (err) { toastError(err); return }
    setSubmitting(true)
    try {
      await updatePartnerStoreApi({
        name: form.name,
        nameEn: form.nameEn,
        city: form.city,
        country: form.country,
        logo: form.logo || undefined,
        banner: form.banner || undefined,
        description: form.description || undefined,
        shippingPolicy: form.shippingPolicy || undefined,
        returnPolicy: form.returnPolicy || undefined,
        minOrder: Number(form.minOrder) || 1,
        bankName: form.bankName || undefined,
        iban: form.iban || undefined,
        company: form.company,
        phone: form.phone || undefined,
      })
      success('تم إرسال طلبك بنجاح! سيتم مراجعته قريباً.')
      router.replace('/partner')
    } catch {
      toastError('حدث خطأ أثناء الإرسال، حاول مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">تسجيل متجرك في مورد</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            الخطوة {step + 1} من {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={STEPS.length} />

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">{STEPS[step]}</h2>

          {step === 0 && <Step1 form={form} set={set} />}
          {step === 1 && <Step2 form={form} set={set} />}
          {step === 2 && <Step3 form={form} set={set} />}
          {step === 3 && <Step4 form={form} set={set} />}
          {step === 4 && <Step5 form={form} />}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prev}
              disabled={step === 0 || submitting}
              className="min-w-[90px]"
            >
              السابق
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="min-w-[90px]">
                التالي
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="min-w-[120px]">
                {submitting ? 'جاري الإرسال…' : 'إرسال الطلب'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
