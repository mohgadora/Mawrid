import { NextRequest, NextResponse } from 'next/server'
import { ok, badRequest, serverError, requireAdmin } from '@/lib/api-helpers'
import { getSupportTickets, createAdminTicket } from '@/services/admin'

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard
  try {
    return ok(await getSupportTickets())
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = await req.json()
    if (!body.subject?.trim() || !body.body?.trim()) return badRequest('subject and body are required')
    return ok(await createAdminTicket({
      subject: body.subject,
      body: body.body,
      priority: body.priority ?? 'medium',
      userId: body.userId ?? guard.id,
    }, guard.id), 201)
  } catch (err) {
    return serverError(err)
  }
}
