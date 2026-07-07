'use client'

import { Suspense } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'

export default function PartnerSignInPage() {
  return (
    <Suspense>
      <PortalAuthShell portal="partner" mode="sign-in" />
    </Suspense>
  )
}
