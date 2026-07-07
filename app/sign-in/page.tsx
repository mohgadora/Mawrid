'use client'

import { Suspense } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'

export default function SignInPage() {
  return (
    <Suspense>
      <PortalAuthShell portal="store" mode="sign-in" />
    </Suspense>
  )
}
