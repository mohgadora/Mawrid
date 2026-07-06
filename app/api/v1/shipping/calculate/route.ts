import { NextRequest } from 'next/server'
import { ok, badRequest, apiError } from '@/lib/api-helpers'
import { calculateShipping } from '@/services/shipping'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get('zoneId')
    const amount = parseFloat(searchParams.get('amount') ?? '')
    const weight = parseFloat(searchParams.get('weight') ?? '0')

    if (!zoneId) return badRequest('zoneId is required')
    if (isNaN(amount)) return badRequest('amount must be a number')

    const result = await calculateShipping(zoneId, amount, isNaN(weight) ? 0 : weight)
    return ok(result)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
