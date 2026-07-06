import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { listActivePlans } from '@/services/subscriptions'

/** GET /api/v1/subscription-plans — الباقات المتاحة (عام). */
export async function GET(_req: NextRequest) {
  try {
    return ok(await listActivePlans())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
