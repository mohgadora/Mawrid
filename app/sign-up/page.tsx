'use client'

import { Suspense, useState } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'
import { useI18n } from '@/lib/i18n'
import { apiFetchBuyerType } from '@/lib/api-client'

function SignUpForm() {
  const { t } = useI18n()
  const [buyerType, setBuyerType] = useState<'consumer' | 'merchant'>('consumer')
  const [company, setCompany] = useState('')

  return (
    <PortalAuthShell
      portal="store"
      mode="sign-up"
      onAfterSignUp={async () => {
        await apiFetchBuyerType({
          role: buyerType,
          company: buyerType === 'merchant' ? company : undefined,
        })
      }}
      extraFields={
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t('authBuyerType')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBuyerType('consumer')}
              className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                buyerType === 'consumer' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {t('authBuyerConsumer')}
            </button>
            <button
              type="button"
              onClick={() => setBuyerType('merchant')}
              className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                buyerType === 'merchant' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              {t('authBuyerMerchant')}
            </button>
          </div>
          {buyerType === 'merchant' && (
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('companyName')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              required
            />
          )}
        </div>
      }
    />
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
