'use client'

import { usePathname } from 'next/navigation'
import { PartnerSidebar, PartnerSidebarProvider, PartnerHeader } from '@/components/partner/partner-sidebar'
import { ImpersonationBanner } from '@/components/partner/impersonation-banner'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === '/partner/sign-in' || pathname === '/partner/sign-up'

  if (isAuth) return <>{children}</>

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
