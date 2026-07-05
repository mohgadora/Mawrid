'use client'

import { Suspense } from 'react'
import { PortalAuthShell } from '@/components/auth/portal-auth-shell'

export default function AdminSignInPage() {
  return (
    <Suspense>
      <PortalAuthShell portal="admin" mode="sign-in" />
    </Suspense>
  )
}
