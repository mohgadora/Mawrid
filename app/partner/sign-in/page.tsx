'use client'

import { Suspense, useState } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'
import { useI18n } from '@/lib/i18n'
import { apiPartnerOnboard } from '@/lib/api-client'

export default function PartnerSignInPage() {
  return (
    <Suspense>
      <PortalAuthShell portal="partner" mode="sign-in" />
    </Suspense>
  )
}
