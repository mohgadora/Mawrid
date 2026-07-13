import { NextRequest } from 'next/server'
import { ok, apiError, badRequest } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { sendOtp } from '@/services/otp'

/** POST /api/v1/auth/otp/send { phone } — يرسل رمز تحقق. */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`${identityKey(req, 'otp')}:send`, 5, 60_000)
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null)
    if (!body?.phone) return badRequest('phone is required')
    return ok(await sendOtp(String(body.phone)))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
