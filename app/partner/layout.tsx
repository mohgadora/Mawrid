'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PartnerSidebar, PartnerSidebarProvider, PartnerHeader } from '@/components/partner/partner-sidebar'
import { ImpersonationBanner } from '@/components/partner/impersonation-banner'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuth = pathname === '/partner/sign-in' || pathname === '/partner/sign-up'
  const isPending = pathname === '/partner/pending'
  const isSkipCheck = isAuth || isPending

  useEffect(() => {
    if (isSkipCheck) return
    const ctrl = new AbortController()
    fetch('/api/v1/partner/store', { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/partner/sign-in')
          return
        }
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}))
          if (body?.message === 'account_pending' || body?.error?.message === 'account_pending') {
            router.replace('/partner/pending')
          }
        }
      })
      .catch(() => undefined)
    return () => ctrl.abort()
  }, [isSkipCheck, router])

  if (isAuth || isPending) return <>{children}</>

  return (
    <PartnerSidebarProvider>
      <div className="flex h-screen overflow-hidden bg-muted/40" dir="rtl">
        <PartnerSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ImpersonationBanner />
          <PartnerHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </PartnerSidebarProvider>
  )
}
