import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, badRequest, requireAdmin } from '@/lib/api-helpers'
import { listTemplates, upsertTemplate } from '@/services/email-templates'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await listTemplates()) } catch (err) { return apiError(err) }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json().catch(() => null)
    if (!body?.event || !body?.subjectAr || !body?.bodyAr) return badRequest('event, subjectAr, bodyAr are required')
    return ok(await upsertTemplate(body, guard.id), 201)
  } catch (err) { return apiError(err) }
}
export function OPTIONS() { return new Response(null, { status: 204 }) }
