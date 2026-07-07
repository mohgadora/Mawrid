'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useI18n } from '@/lib/i18n'

function ResetForm() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError(t('authErrorGeneric'))
      return
    }
    setLoading(true)
    try {
      const res = await authClient.resetPassword({ newPassword: password, token })
      if (res.error) setError(res.error.message ?? t('authErrorGeneric'))
      else {
        router.push('/sign-in')
        router.refresh()
      }
    } catch {
      setError(t('authErrorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-center text-xl font-bold">{t('resetPassword')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {loading ? t('saving') : t('resetPassword')}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link href="/sign-in" className="text-primary hover:underline">{t('backToLogin')}</Link>
        </p>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
