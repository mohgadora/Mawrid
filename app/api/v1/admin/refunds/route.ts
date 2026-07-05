import { NextRequest } from 'next/server'
import { requireAdmin, ok, apiError } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { getAdminRefundRequests } from '@/services/refunds'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard instanceof NextResponse) return guard
    const status = req.nextUrl.searchParams.get('status') ?? undefined
    const rows = await getAdminRefundRequests(status ? { status } : undefined)
    return ok(rows)
  } catch (err) {
    return apiError(err)
  }
}
