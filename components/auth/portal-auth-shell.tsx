'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  Handshake,
  Shield,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useI18n } from '@/lib/i18n'
import {
  type AuthPortal,
  PORTAL_SIGN_IN,
  PORTAL_SIGN_UP,
  resolvePostAuthRedirect,
} from '@/lib/auth-portals'
import { cn } from '@/lib/utils'

type PortalMeta = { icon: LucideIcon; accent: string }

const PORTAL_META: Record<AuthPortal, PortalMeta> = {
  store: { icon: ShoppingBag, accent: 'text-primary' },
  partner: { icon: Handshake, accent: 'text-chart-3' },
  admin: { icon: Shield, accent: 'text-destructive' },
}

type Props = {
  portal: AuthPortal
  mode: 'sign-in' | 'sign-up'
  extraFields?: React.ReactNode
  onAfterSignUp?: (ctx: { name: string; email: string }) => Promise<void>
}

export function PortalAuthShell({ portal, mode, extraFields, onAfterSignUp }: Props) {
  const { t, brand } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const urlError = searchParams.get('error')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const portalMeta = PORTAL_META[portal] ?? PORTAL_META.store
  const Icon = portalMeta.icon
  const titleKey = mode === 'sign-in' ? `authSignIn_${portal}` : `authSignUp_${portal}`
  const descKey = mode === 'sign-in' ? `authSignInDesc_${portal}` : `authSignUpDesc_${portal}`

  const errorMessages: Record<string, string> = {
    'not-admin': t('authErrorNotAdmin'),
    'not-partner': t('authErrorNotPartner'),
    'use-partner-portal': t('authErrorUsePartnerPortal'),
    forbidden: t('authErrorForbidden'),
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) {
          setError(result.error.message ?? t('authErrorGeneric'))
          return
        }
      } else {
        const result = await authClient.signUp.email({ name, email, password })
        if (result.error) {
          setError(result.error.message ?? t('authErrorGeneric'))
          return
        }
        if (onAfterSignUp) await onAfterSignUp({ name, email })
      }

      const session = await authClient.getSession()
      const role = (session.data?.user as { role?: string } | undefined)?.role ?? 'consumer'
      router.push(resolvePostAuthRedirect(portal, role, from))
      router.refresh()
    } catch {
      setError(t('authErrorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const signInHref = PORTAL_SIGN_IN[portal] + (from ? `?from=${encodeURIComponent(from)}` : '')
  const signUpHref = PORTAL_SIGN_UP[portal] + (from ? `?from=${encodeURIComponent(from)}` : '')

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className={cn('mx-auto grid size-14 place-items-center rounded-2xl bg-card shadow-sm ring-1 ring-border', portalMeta.accent)}>
            <Icon className="size-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{brand}</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{t(titleKey as Parameters<typeof t>[0])}</h1>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">{t(descKey as Parameters<typeof t>[0])}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {urlError && errorMessages[urlError] && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessages[urlError]}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'sign-up' && (
              <AuthField label={t('name')} id="name">
                <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </AuthField>
            )}
            <AuthField label={t('email')} id="email">
              <input id="email" type="email" autoComplete="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </AuthField>
            <AuthField label={t('password')} id="password">
              <input id="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required minLength={mode === 'sign-up' ? 8 : undefined} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
            </AuthField>
            {mode === 'sign-up' && extraFields}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {loading ? t('saving') : mode === 'sign-in' ? t('login') : t('signup')}
              {!loading && <ArrowRight className="size-4 rtl:rotate-180" />}
            </button>
          </form>
          {mode === 'sign-in' && (portal === 'store' || portal === 'partner') && (
            <p className="mt-3 text-center text-xs">
              <Link href="/forgot-password" className="text-primary hover:underline">{t('forgotPassword')}</Link>
            </p>
          )}
        </div>

        {mode === 'sign-in' && portal !== 'admin' && (
          <p className="text-center text-sm text-muted-foreground">
            {t('authNoAccount')}{' '}
            <Link href={signUpHref} className="font-semibold text-primary hover:underline">{t('signup')}</Link>
          </p>
        )}
        {mode === 'sign-up' && (
          <p className="text-center text-sm text-muted-foreground">
            {t('authHasAccount')}{' '}
            <Link href={signInHref} className="font-semibold text-primary hover:underline">{t('login')}</Link>
          </p>
        )}

        <PortalSwitcher current={portal} />
      </div>
    </main>
  )
}

function AuthField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

function PortalSwitcher({ current }: { current: AuthPortal }) {
  const { t } = useI18n()
  const links: { portal: AuthPortal; href: string; labelKey: string }[] = [
    { portal: 'store', href: '/sign-in', labelKey: 'authPortalStore' },
    { portal: 'partner', href: '/partner/sign-in', labelKey: 'authPortalPartner' },
    { portal: 'admin', href: '/admin/sign-in', labelKey: 'authPortalAdmin' },
  ]
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">{t('authSwitchPortal')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {links.filter((l) => l.portal !== current).map((l) => (
          <Link key={l.portal} href={l.href} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent">
            {t(l.labelKey as Parameters<typeof t>[0])}
          </Link>
        ))}
        <Link href="/auth" className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t('authAllPortals')}
        </Link>
      </div>
    </div>
  )
}
