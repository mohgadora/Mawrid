import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

/** Standard page frame: header, main content, footer. Bottom nav is global. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
