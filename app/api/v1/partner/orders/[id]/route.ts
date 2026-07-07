import { NextRequest, NextResponse } from 'next/server'
import { ok, requirePartner, apiError, badRequest } from '@/lib/api-helpers'
import { getPartnerOrderDetail, recordSellerEarning } from '@/services/partner'
import { db } from '@/lib/db'
import { order, orderEvent } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const PARTNER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['packed'],
  packed:           ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const { id } = await params
    return ok(await getPartnerOrderDetail(id, guard))
  } catch (err) {
    return apiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  try {
    const { id } = await params
    const body = await req.json() as { status?: unknown; note?: unknown }
    const newStatus = String(body.status ?? '')

    // Verify this order belongs to this supplier (ownership check)
    const detail = await getPartnerOrderDetail(id, guard)
    if (!detail) return badRequest('الطلب غير موجود')

    const current = detail.status as string
    const allowed = PARTNER_ALLOWED_TRANSITIONS[current] ?? []
    if (!allowed.includes(newStatus)) {
      return badRequest(`لا يمكن الانتقال من "${current}" إلى "${newStatus}"`)
    }

    await db.transaction(async (tx) => {
      await tx
        .update(order)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          ...(newStatus === 'delivered' ? { deliveredAt: new Date() } : {}),
        })
        .where(eq(order.id, id))

      await tx.insert(orderEvent).values({
        id:        crypto.randomUUID(),
        orderId:   id,
        status:    newStatus,
        note:      body.note ? String(body.note).slice(0, 500) : null,
        createdBy: guard.id,
        createdAt: new Date(),
      })
    })

    // Record seller commission after the status transaction
    // Log failures so they can be manually reconciled — never silently drop
    if (newStatus === 'delivered') {
      await recordSellerEarning(id).catch((err) => {
        console.error(`[earnings] Failed to record earning for order ${id}:`, err)
      })
    }

    return ok({ success: true, status: newStatus })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
