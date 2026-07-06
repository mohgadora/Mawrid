'use client'

import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { PhoneVerify } from '@/components/phone-verify'

export function PhoneVerifyView() {
  const { lang } = useI18n()
  const router = useRouter()
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-xl font-black text-foreground">
        {lang === 'ar' ? 'توثيق رقم الجوال' : 'Phone verification'}
      </h1>
      <PhoneVerify onVerified={() => setTimeout(() => router.push('/account'), 800)} />
    </div>
  )
}
