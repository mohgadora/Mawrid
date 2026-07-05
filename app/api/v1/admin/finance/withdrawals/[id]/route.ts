import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin, badRequest } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { payout } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const
type PayoutStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  const { id } = await params

  try {
    const body = await req.json() as { status?: unknown; reference?: unknown; adminNote?: unknown }

    const status = body.status as string
    if (!VALID_STATUSES.includes(status as PayoutStatus)) {
      return badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`)
    }

    const [existing] = await db.select().from(payout).where(eq(payout.id, id)).limit(1)
    if (!existing) return badRequest('Withdrawal not found')

    const [updated] = await db
      .update(payout)
      .set({
        status,
        ...(status === 'completed' && {
          processedAt: new Date(),
          ...(body.reference ? { reference: String(body.reference).slice(0, 200) } : {}),
        }),
      })
      .where(eq(payout.id, id))
      .returning()

    await writeAuditLog({
      userId:   guard.id,
      action:   `withdrawal_${status}`,
      entity:   'payout',
      entityId: id,
      meta:     { status, reference: body.reference ?? null },
    })

    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}
