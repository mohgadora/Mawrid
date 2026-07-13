import { isValidationError, isNotFoundError, isUnauthorizedError } from '@/lib/errors'
import { captureError } from '@/lib/observability'
/**
 * lib/api-helpers.ts — Shared utilities for /api/v1 route handlers.
 * Supports both cookie-based (web) and Bearer token (mobile) authentication.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { readImpersonation } from '@/lib/impersonation'
import { db } from '@/lib/db'
import { supplier } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type ApiUser = { id: string; role: string; email: string; name: string; impersonatedSupplierId?: string }

/** Extracts the current user from either a session cookie or a Bearer token. */
export async function getApiUser(req?: NextRequest): Promise<ApiUser | null> {
  try {
    // Build headers: merge request headers with Next.js server headers
    const reqHeaders = req?.headers ? Object.fromEntries(req.headers.entries()) : {}
    const serverHeaders = await headers()
    const merged = new Headers(serverHeaders)
    for (const [k, v] of Object.entries(reqHeaders)) merged.set(k, v)

    const session = await auth.api.getSession({ headers: merged })
    if (!session?.user) return null
    const role = (session.user as { role?: string }).role ?? 'consumer'
    const apiUser: ApiUser = {
      id: session.user.id,
      role,
      email: session.user.email,
      name: session.user.name,
    }
    if (role === 'admin') {
      const imp = await readImpersonation()
      if (imp) apiUser.impersonatedSupplierId = imp.supplierId
    }
    return apiUser
  } catch {
    return null
  }
}

/**
 * حارس الأدمن (defense in depth). لا تعتمد على proxy.ts وحده — فهو ليس حداً
 * أمنياً موثوقاً (CVE-2025-29927). استخدمه في بداية كل admin route:
 *
 *   const guard = await requireAdmin(req)
 *   if (guard instanceof NextResponse) return guard
 */
export async function requireAdmin(req?: NextRequest): Promise<ApiUser | NextResponse> {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'admin') return forbidden()
  return user
}

/** Supplier / partner portal guard */
export async function requirePartner(req?: NextRequest): Promise<ApiUser | NextResponse> {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  if (user.role !== 'supplier' && user.role !== 'admin') return forbidden()
  // Admin impersonation bypasses verification check
  if (user.role === 'admin') return user
  // For suppliers: check that account is verified
  if (!user.impersonatedSupplierId) {
    const [sup] = await db.select({ verified: supplier.verified }).from(supplier).where(eq(supplier.userId, user.id)).limit(1)
    if (!sup || !sup.verified) {
      return NextResponse.json({ error: 'Forbidden', message: 'account_pending' }, { status: 403 })
    }
  }
  return user
}

/** Returns a 401 JSON response. */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/** Returns a 403 JSON response. */
export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/** Returns a 404 JSON response. */
export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

/** Returns a 400 JSON response. */
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Returns a 500 JSON response.
 * تُسجَّل التفاصيل الكاملة في سجل الخادم فقط؛ العميل يرى رسالة عامة في الإنتاج.
 */
export function serverError(err: unknown) {
  const eventId = captureError(err, { scope: 'api' })
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Internal server error'
  // eventId يُمكّن ربط شكوى المستخدم بالسجلّ دون كشف التفاصيل.
  return NextResponse.json({ error: message, eventId }, { status: 500 })
}

/**
 * يوجّه الخطأ: أخطاء التحقّق القابلة للتصحيح → 400 (برسالتها الآمنة)،
 * وأي خطأ آخر غير متوقّع → 500.
 */
export function apiError(err: unknown) {
  if (isValidationError(err)) return badRequest(err.message)
  if (isNotFoundError(err)) return notFound(err.message)
  if (isUnauthorizedError(err)) return unauthorized()
  if (err instanceof Error && err.message === 'Unauthorized') return unauthorized()
  return serverError(err)
}

/** Returns a 200 JSON success response. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

/** CORS preflight response for OPTIONS requests. */
export function corsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  })
}
