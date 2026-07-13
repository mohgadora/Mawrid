'use client'

import { useState } from 'react'
import { Phone, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { sendOtpApi, verifyOtpApi } from '@/lib/api-client'

/**
 * تحقّق رقم الجوال عبر OTP. عند النجاح يُربط الرقم بحساب المستخدم المسجّل.
 * onVerified يُستدعى بعد التحقق الناجح.
 */
export function PhoneVerify({ onVerified }: { onVerified?: (phone: string) => void }) {
  const { lang } = useI18n()
  const toast = useToast()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [busy, setBusy] = useState(false)

  async function send() {
    if (!phone.trim() || busy) return
    setBusy(true)
    try {
      const res = await sendOtpApi(phone.trim())
      setStage('code')
      if (res.devCode) {
        toast.success(lang === 'ar' ? `رمز التطوير: ${res.devCode}` : `Dev code: ${res.devCode}`)
      } else {
        toast.success(lang === 'ar' ? 'تم إرسال الرمز' : 'Code sent')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : lang === 'ar' ? 'تعذّر الإرسال' : 'Failed to send')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (code.length !== 6 || busy) return
    setBusy(true)
    try {
      await verifyOtpApi(phone.trim(), code.trim())
      toast.success(lang === 'ar' ? 'تم التحقق من رقمك' : 'Phone verified')
      onVerified?.(phone.trim())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : lang === 'ar' ? 'رمز غير صحيح' : 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-foreground">
        <ShieldCheck className="size-5 text-primary" />
        {lang === 'ar' ? 'تأكيد رقم الجوال' : 'Verify phone number'}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {lang === 'ar' ? 'أدخل رقمك بالصيغة الدولية (مثل +9665xxxxxxxx).' : 'Enter your number in international format (e.g. +9665xxxxxxxx).'}
      </p>

      {stage === 'phone' ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="+9665xxxxxxxx"
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background py-2.5 ps-9 pe-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="button" onClick={send} disabled={busy || !phone.trim()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {busy ? '...' : lang === 'ar' ? 'إرسال الرمز' : 'Send code'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="000000"
              dir="ltr"
              inputMode="numeric"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-center text-lg font-black tracking-[0.4em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {busy ? '...' : lang === 'ar' ? 'تحقّق' : 'Verify'}
            </button>
          </div>
          <button type="button" onClick={() => { setStage('phone'); setCode('') }} className="text-xs text-muted-foreground hover:text-foreground">
            {lang === 'ar' ? 'تغيير الرقم' : 'Change number'}
          </button>
        </div>
      )}
    </div>
  )
}
