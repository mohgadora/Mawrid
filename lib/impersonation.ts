/**
 * lib/impersonation.ts — "الدخول كمتجر" (Login as store) للأدمن فقط.
 *
 * الأمان: رمز موقّع بـ HMAC-SHA256 باستخدام BETTER_AUTH_SECRET، يُصدره الخادم
 * فقط بعد التحقّق من صلاحية الأدمن. المتصفّح لا يستطيع تزويره. الكوكي HttpOnly
 * قصيرة العمر، فلا تُقرأ من JavaScript ولا تدوم.
 */
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const IMPERSONATION_COOKIE = 'mawrid_imp'
const TTL_SECONDS = 30 * 60 // 30 دقيقة

type Payload = { adminId: string; supplierId: string; exp: number }

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET
  if (!s) throw new Error('[impersonation] BETTER_AUTH_SECRET is required')
  return s
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url')
}

/** يبني قيمة الكوكي الموقّعة. */
export function createImpersonationToken(adminId: string, supplierId: string): string {
  const payload: Payload = { adminId, supplierId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }
  const payloadB64 = b64url(JSON.stringify(payload))
  return `${payloadB64}.${sign(payloadB64)}`
}

/** يتحقّق من التوقيع والصلاحية الزمنية؛ يعيد الحمولة أو null. */
export function verifyImpersonationToken(token: string | undefined): Payload | null {
  if (!token || !token.includes('.')) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const expected = sign(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as Payload
    if (!payload.supplierId || !payload.adminId) return null
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/** يقرأ حمولة الانتحال من الكوكي الحالية (إن وُجدت وصحّت). */
export async function readImpersonation(): Promise<Payload | null> {
  const store = await cookies()
  return verifyImpersonationToken(store.get(IMPERSONATION_COOKIE)?.value)
}

/** خصائص الكوكي الموحّدة (تُستخدم للضبط والحذف). */
export function impersonationCookieOptions(maxAge: number) {
  const secure = (process.env.BETTER_AUTH_URL ?? '').startsWith('https://')
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge,
  }
}
