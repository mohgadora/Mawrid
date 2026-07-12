import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthRoute } from '@/lib/auth-portals'

/**
 * Route protection middleware.
 *
 * - /admin/*         → admin role (except /admin/sign-in)
 * - /partner/*       → supplier role (except partner auth pages)
 * - /account/*       → any authenticated session
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAuthRoute(pathname)) return NextResponse.next()

  // ── Platform admin panel ─────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const session = await fetchSession(request)
    if (!session) {
      return NextResponse.redirect(new URL(`/admin/sign-in?from=${encodeURIComponent(pathname)}`, request.url))
    }
    if (session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/sign-in?error=not-admin', request.url))
    }
    return NextResponse.next()
  }

  // ── Partner / supplier portal ────────────────────────────────────────────
  if (pathname.startsWith('/partner')) {
    const session = await fetchSession(request)
    if (!session) {
      return NextResponse.redirect(new URL(`/partner/sign-in?from=${encodeURIComponent(pathname)}`, request.url))
    }
    if (session.user?.role !== 'supplier' && session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/partner/sign-in?error=not-partner', request.url))
    }
    return NextResponse.next()
  }

  // ── Buyer account pages ──────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    const session = await fetchSession(request)
    if (!session) {
      return NextResponse.redirect(new URL(`/sign-in?from=${encodeURIComponent(pathname)}`, request.url))
    }
    return NextResponse.next()
  }

  // ── REST API: admin scope ────────────────────────────────────────────────
  if (pathname.startsWith('/api/v1/admin')) {
    const session = await fetchSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.next()
  }

  // ── REST API: partner scope ──────────────────────────────────────────────
  if (pathname.startsWith('/api/v1/partner')) {
    const session = await fetchSession(request)
    if (pathname.endsWith('/onboard') && !session) return NextResponse.next()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user?.role !== 'supplier' && session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // ── REST API: buyer account ──────────────────────────────────────────────
  // الشراء كضيف عام (بلا حساب) — يتحقق المسار نفسه من المدخلات ويحدّ المعدّل.
  if (pathname === '/api/v1/orders/guest') {
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/v1/account') || pathname.startsWith('/api/v1/orders')) {
    const session = await fetchSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.next()
  }

  return NextResponse.next()
}

async function fetchSession(request: NextRequest) {
  try {
    const url = new URL('/api/auth/get-session', request.url)
    const res = await fetch(url, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        authorization: request.headers.get('authorization') ?? '',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as {
      session?: { id: string } | null
      user?: { id: string; role?: string } | null
    } | null
    if (!data?.session || !data?.user) return null
    return { user: { id: data.user.id, role: data.user.role ?? 'consumer' } }
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/partner',
    '/partner/:path*',
    '/account',
    '/account/:path*',
    '/api/v1/admin/:path*',
    '/api/v1/partner/:path*',
    '/api/v1/account/:path*',
    '/api/v1/orders/:path*',
  ],
}
