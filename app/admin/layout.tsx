'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar, SidebarProvider } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === '/admin/sign-in'

  if (isAuth) return <>{children}</>

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-muted/40" dir="rtl">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
