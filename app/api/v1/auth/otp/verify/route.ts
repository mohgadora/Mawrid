import { NextRequest } from 'next/server'
import { ok, apiError, badRequest, getApiUser } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { verifyOtp } from '@/services/otp'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/v1/auth/otp/verify { phone, code }
 * يتحقق من الرمز. إن كان المستخدم مسجّلاً، يربط الرقم بحسابه ويعلّمه موثّقاً.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`${identityKey(req, 'otp')}:verify`, 10, 60_000)
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null)
    if (!body?.phone || !body?.code) return badRequest('phone and code are required')

    await verifyOtp(String(body.phone), String(body.code))

    // اربط الرقم بالحساب الحالي إن وُجد
    const current = await getApiUser(req)
    if (current) {
      await db
        .update(user)
        .set({ phone: String(body.phone), phoneVerified: true, updatedAt: new Date() })
        .where(eq(user.id, current.id))
    }

    return ok({ verified: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
