import { ok, apiError } from '@/lib/api-helpers'
import { getActiveFlashSales } from '@/services/flash-sales'

export async function GET() {
  try {
    return ok(await getActiveFlashSales())
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
