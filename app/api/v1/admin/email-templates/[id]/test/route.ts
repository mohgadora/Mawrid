import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { sendTestTemplate } from '@/services/email-templates'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const to = String(body?.to ?? '').trim()
    if (!to || !to.includes('@')) return badRequest('valid email required')
    await sendTestTemplate(id, to)
    return ok({ sent: true })
  } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
