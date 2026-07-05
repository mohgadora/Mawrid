'use client'

import { Suspense, useState } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'
import { useI18n } from '@/lib/i18n'
import { apiPartnerOnboard } from '@/lib/api-client'

function PartnerSignUpForm() {
  const { t } = useI18n()
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [crNumber, setCrNumber] = useState('')

  return (
    <PortalAuthShell
      portal="partner"
      mode="sign-up"
      onAfterSignUp={async ({ name }) => {
        await apiPartnerOnboard({ company: company || name, phone, crNumber })
      }}
      extraFields={
        <div className="space-y-3">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t('companyName')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phoneNumber')}
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={crNumber}
            onChange={(e) => setCrNumber(e.target.value)}
            placeholder={t('authCrNumber')}
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      }
    />
  )
}

export default function PartnerSignUpPage() {
  return (
    <Suspense>
      <PartnerSignUpForm />
    </Suspense>
  )
}
