import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { topup } from '@/services/wallet'

/**
 * POST /api/v1/wallet/topup — شحن المحفظة.
 * ملاحظة: في الإنتاج يجب أن يمرّ الشحن عبر بوابة دفع مُتحقَّقة قبل الإيداع.
 * body: { amount, method? }
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  const limited = rateLimit(`${identityKey(req, 'wallet', user.id)}:topup`, 10, 60_000)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => null)
    const amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) return badRequest('amount must be a positive number')
    if (amount > 100_000) return badRequest('amount exceeds the allowed limit')
    const method = typeof body?.method === 'string' ? body.method : 'manual'
    return ok(await topup(user.id, amount, method))
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
