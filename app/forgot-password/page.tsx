'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { useI18n } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (res.error) setError(res.error.message ?? t('authErrorGeneric'))
      else setSent(true)
    } catch {
      setError(t('authErrorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-xl font-bold">{t('forgotPassword')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('forgotPasswordDesc')}</p>
        </div>
        {sent ? (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{t('forgotPasswordSent')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {loading ? t('saving') : t('sendResetLink')}
            </button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/sign-in" className="text-primary hover:underline">{t('backToLogin')}</Link>
        </p>
      </div>
    </main>
  )
}
