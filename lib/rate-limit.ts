import { NextRequest, NextResponse } from 'next/server'

/**
 * lib/rate-limit.ts — محدِّد معدّل بسيط في الذاكرة (fixed window).
 *
 * ⚠️ يعمل لكل عملية Node منفصلة. لنشر متعدد النسخ (عدة instances/PM2 cluster)
 * استبدله بـ Redis (INCR + EXPIRE) — البنية جاهزة لذلك.
 */
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// تنظيف دوري للمفاتيح المنتهية حتى لا تكبر الذاكرة
setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}, 60_000).unref?.()

/**
 * يستخرج معرّف العميل للحدّ.
 * x-forwarded-for قابل للتزوير ما لم يضبطه reverse proxy موثوق. لذلك لا نثق
 * به إلا عند RATE_LIMIT_TRUST_PROXY=true (اضبطه فقط خلف بروكسي يعيد كتابة الهيدر).
 * بدونه نعتمد على x-real-ip (يضعه البروكسي عادةً) ثم 'unknown'.
 */
const TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY === 'true'

export function clientKey(req: NextRequest, scope: string): string {
  let ip = req.headers.get('x-real-ip')?.trim() || ''
  if (!ip && TRUST_PROXY) {
    ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  }
  return `${scope}:${ip || 'unknown'}`
}

/**
 * مفتاح هوية للحدّ: يفضّل معرّف المستخدم (أدقّ وأصعب على التزوير) عند توفّره،
 * وإلا يعود إلى IP. استخدمه للنقاط المكلفة (AI).
 */
export function identityKey(req: NextRequest, scope: string, userId?: string | null): string {
  if (userId) return `${scope}:u:${userId}`
  return clientKey(req, `${scope}:ip`)
}

/**
 * يرجع NextResponse(429) إن تجاوز الحد، أو null إن كان ضمن الحد.
 *   const limited = rateLimit(clientKey(req, 'ai'), 10, 60_000)
 *   if (limited) return limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }
  if (b.count >= limit) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }
  b.count++
  return null
}
