'use client'

import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export default function PartnerPendingPage() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.replace('/partner/sign-in')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">طلبك قيد المراجعة</h1>
          <p className="text-muted-foreground">
            شكراً لتسجيلك في منصة مورد. فريقنا يراجع طلبك حالياً وسيتم الرد عليك في غضون{' '}
            <span className="font-semibold text-foreground">2-3 أيام عمل</span>.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 text-start space-y-3">
          <h2 className="text-sm font-semibold text-foreground">ما الذي يحدث الآن؟</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
              <span>يراجع فريقنا بياناتك ووثائق التحقق (KYC)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
              <span>ستصلك رسالة بريد إلكتروني عند اتخاذ القرار</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
              <span>بعد الموافقة يمكنك تسجيل الدخول وإدارة متجرك</span>
            </li>
          </ul>
        </div>

        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )
}
