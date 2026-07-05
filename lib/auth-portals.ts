/**
 * Three-portal auth model (global marketplace pattern):
 *
 * 1. store   — consumers & retail merchants (buyers: مستهلكون + تجار تجزئة/بقالات)
 * 2. partner — suppliers & partners (sellers: موردون + شركاء)
 * 3. admin   — platform operations (لوحة الإدارة)
 */

export type AuthPortal = 'store' | 'partner' | 'admin'

export type UserRole = 'consumer' | 'merchant' | 'supplier' | 'admin'

export const PORTAL_HOME: Record<AuthPortal, string> = {
  store: '/',
  partner: '/partner',
  admin: '/admin',
}

export const PORTAL_SIGN_IN: Record<AuthPortal, string> = {
  store: '/sign-in',
  partner: '/partner/sign-in',
  admin: '/admin/sign-in',
}

export const PORTAL_SIGN_UP: Record<AuthPortal, string> = {
  store: '/sign-up',
  partner: '/partner/sign-up',
  admin: '/admin/sign-in',
}

/** Roles permitted to sign in through each portal. */
export const PORTAL_ALLOWED_ROLES: Record<AuthPortal, UserRole[]> = {
  store: ['consumer', 'merchant'],
  partner: ['supplier', 'admin'],
  admin: ['admin'],
}

export function resolvePostAuthRedirect(
  portal: AuthPortal,
  role: string,
  from?: string | null,
): string {
  const safeFrom = from && from.startsWith('/') && !from.startsWith('//') ? from : null

  if (portal === 'admin') {
    if (role !== 'admin') return `${PORTAL_SIGN_IN.admin}?error=not-admin`
    return safeFrom?.startsWith('/admin') && !safeFrom.includes('sign-in') ? safeFrom : PORTAL_HOME.admin
  }

  if (portal === 'partner') {
    if (role !== 'supplier' && role !== 'admin') {
      return `${PORTAL_SIGN_IN.partner}?error=not-partner`
    }
    return safeFrom?.startsWith('/partner') && !safeFrom.includes('sign-in') ? safeFrom : PORTAL_HOME.partner
  }

  // Store — buyers; route platform staff to their workspaces
  if (role === 'admin') return PORTAL_HOME.admin
  if (role === 'supplier') return PORTAL_HOME.partner
  if (role === 'consumer' || role === 'merchant') {
    if (safeFrom && !safeFrom.startsWith('/admin') && !safeFrom.startsWith('/partner')) {
      return safeFrom
    }
    return PORTAL_HOME.store
  }
  return PORTAL_HOME.store
}

export function portalFromPathname(pathname: string): AuthPortal | null {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/partner')) return 'partner'
  return null
}

export function isAuthRoute(pathname: string): boolean {
  return (
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/auth' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/admin/sign-in' ||
    pathname === '/partner/sign-in' ||
    pathname === '/partner/sign-up'
  )
}
