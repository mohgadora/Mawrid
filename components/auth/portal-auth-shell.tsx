'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  Handshake,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
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

// Map Better Auth error codes / messages → user-friendly Arabic
const AUTH_ERROR_MAP: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  INVALID_PASSWORD: 'كلمة المرور غير صحيحة',
  USER_NOT_FOUND: 'لا يوجد حساب بهذا البريد الإلكتروني',
  EMAIL_NOT_VERIFIED: 'يرجى تأكيد بريدك الإلكتروني أولاً',
  USER_ALREADY_EXISTS: 'يوجد حساب مسجّل بهذا البريد الإلكتروني',
  EMAIL_ALREADY_EXISTS: 'يوجد حساب مسجّل بهذا البريد الإلكتروني',
  TOO_MANY_REQUESTS: 'محاولات كثيرة، يرجى الانتظار قليلاً ثم المحاولة مجدداً',
  ACCOUNT_DISABLED: 'الحساب موقوف، تواصل مع الدعم',
  timeout: 'انتهت مهلة الاتصال، تحقق من اتصالك بالإنترنت',
  'Failed to fetch': 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت',
  NetworkError: 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت',
}

function mapAuthError(raw: string | undefined): string {
  if (!raw) return 'حدث خطأ، يرجى المحاولة مرة أخرى'
  for (const [key, msg] of Object.entries(AUTH_ERROR_MAP)) {
    if (raw.toUpperCase().includes(key.toUpperCase()) || raw.includes(key)) return msg
  }
  return raw
}

type Props = {
  portal: AuthPortal
  mode: 'sign-in' | 'sign-up'
  extraFields?: React.ReactNode
  onAfterSignUp?: (ctx: { name: string; email: string }) => Promise<void>
}

const AUTH_TIMEOUT_MS = 15_000

export function PortalAuthShell({ portal, mode, extraFields, onAfterSignUp }: Props) {
  const { t, brand } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from')
  const urlError = searchParams.get('error')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), AUTH_TIMEOUT_MS)

    try {
      if (mode === 'sign-in') {
        const result = await authClient.signIn.email({ email, password, fetchOptions: { signal: abort.signal } })
        if (result.error) {
          setError(mapAuthError(result.error.message))
          setLoading(false)
          return
        }
        const role = (result.data?.user as { role?: string } | undefined)?.role ?? 'consumer'
        // Keep loading=true during navigation so button doesn't re-enable mid-redirect
        router.push(resolvePostAuthRedirect(portal, role, from))
        return
      }

      // Sign-up
      const result = await authClient.signUp.email({ name, email, password, fetchOptions: { signal: abort.signal } })
      if (result.error) {
        setError(mapAuthError(result.error.message))
        setLoading(false)
        return
      }
      if (onAfterSignUp) {
        try {
          await onAfterSignUp({ name, email })
        } catch {
          // Best-effort — account is created; don't block navigation
        }
      }
      const role = (result.data?.user as { role?: string } | undefined)?.role ?? 'consumer'
      // Keep loading=true during navigation
      router.push(resolvePostAuthRedirect(portal, role, from))
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(AUTH_ERROR_MAP.timeout)
      } else {
        setError(mapAuthError(msg))
      }
      setLoading(false)
    } finally {
      clearTimeout(timer)
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
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                disabled={loading}
              />
            </AuthField>
            <AuthField label={t('password')} id="password">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  minLength={mode === 'sign-up' ? 8 : undefined}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputClass, 'pe-10')}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </AuthField>
            {mode === 'sign-up' && extraFields}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{mode === 'sign-in' ? 'جارٍ الدخول...' : 'جارٍ إنشاء الحساب...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'sign-in' ? t('login') : t('signup')}</span>
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {portal === 'store' && (
            <div className="mt-4">
              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t('authOr')}
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: from || '/' })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                    <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
                  </svg>
                  {t('authContinueGoogle')}
                </button>
                <button
                  type="button"
                  onClick={() => authClient.signIn.social({ provider: 'apple', callbackURL: from || '/' })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                    <path d="M16.36 12.7c-.02-2.02 1.65-2.99 1.73-3.04-.94-1.38-2.4-1.57-2.93-1.59-1.25-.13-2.43.73-3.06.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.4 2.43-.36 6.02 1 8 .67.96 1.46 2.04 2.5 2 1-.04 1.38-.65 2.6-.65 1.2 0 1.55.65 2.6.63 1.08-.02 1.76-.98 2.42-1.95.76-1.11 1.08-2.19 1.09-2.24-.02-.01-2.09-.8-2.11-3.18ZM14.4 6.7c.55-.67.93-1.6.83-2.53-.8.03-1.77.53-2.35 1.2-.51.59-.96 1.53-.84 2.44.9.07 1.8-.45 2.36-1.11Z" />
                  </svg>
                  {t('authContinueApple')}
                </button>
              </div>
            </div>
          )}

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

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60'

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
