'use server only'
import 'server-only'
import { db } from '@/lib/db'
import { refundRequest, order, user } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRef() {
  return 'REF-' + Date.now().toString(36).toUpperCase()
}

// ── customer ─────────────────────────────────────────────────────────────────

export async function createRefundRequest(
  userId: string,
  data: {
    orderId: string
    orderLineId?: string
    reason: string
    description?: string
    images?: string[]
  },
) {
  // verify order belongs to user
  const [ord] = await db.select().from(order).where(eq(order.id, data.orderId)).limit(1)
  if (!ord) throw new Error('Order not found')
  if (ord.userId !== userId) throw new Error('Unauthorized')
  // check order status allows refund
  const refundableStatuses = ['delivered', 'completed', 'processing', 'shipped']
  if (!refundableStatuses.includes(ord.status)) {
    throw new Error(`Cannot request refund for order with status: ${ord.status}`)
  }

  const items = data.orderLineId ? [{ orderLineId: data.orderLineId }] : []

  const [inserted] = await db
    .insert(refundRequest)
    .values({
      id:        crypto.randomUUID(),
      ref:       makeRef(),
      orderId:   data.orderId,
      userId,
      items,
      reason:    data.reason,
      notes:     data.description ?? null,
      images:    data.images ?? [],
      status:    'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return inserted
}

export async function getRefundRequests(userId: string) {
  const rows = await db
    .select({
      id:          refundRequest.id,
      ref:         refundRequest.ref,
      orderId:     refundRequest.orderId,
      orderRef:    order.ref,
      orderTotal:  order.total,
      reason:      refundRequest.reason,
      notes:       refundRequest.notes,
      status:      refundRequest.status,
      refundAmount:refundRequest.refundAmount,
      adminNote:   refundRequest.adminNote,
      reviewedAt:  refundRequest.reviewedAt,
      images:      refundRequest.images,
      createdAt:   refundRequest.createdAt,
    })
    .from(refundRequest)
    .innerJoin(order, eq(order.id, refundRequest.orderId))
    .where(eq(refundRequest.userId, userId))
    .orderBy(desc(refundRequest.createdAt))

  return rows
}

// ── admin ─────────────────────────────────────────────────────────────────────

export async function getAdminRefundRequests(filters?: { status?: string }) {
  const query = db
    .select({
      id:           refundRequest.id,
      ref:          refundRequest.ref,
      orderId:      refundRequest.orderId,
      orderRef:     order.ref,
      orderTotal:   order.total,
      userId:       refundRequest.userId,
      userName:     user.name,
      userEmail:    user.email,
      reason:       refundRequest.reason,
      notes:        refundRequest.notes,
      status:       refundRequest.status,
      refundAmount: refundRequest.refundAmount,
      adminNote:    refundRequest.adminNote,
      reviewedBy:   refundRequest.reviewedBy,
      reviewedAt:   refundRequest.reviewedAt,
      images:       refundRequest.images,
      createdAt:    refundRequest.createdAt,
    })
    .from(refundRequest)
    .innerJoin(order, eq(order.id, refundRequest.orderId))
    .innerJoin(user, eq(user.id, refundRequest.userId))
    .orderBy(desc(refundRequest.createdAt))
    .limit(200)

  if (filters?.status) {
    return query.where(eq(refundRequest.status, filters.status))
  }
  return query
}

export async function approveRefund(requestId: string, adminUserId: string, adminNote?: string) {
  const now = new Date()
  await db
    .update(refundRequest)
    .set({
      status:     'approved',
      adminNote:  adminNote ?? null,
      reviewedBy: adminUserId,
      reviewedAt: now,
      updatedAt:  now,
    })
    .where(eq(refundRequest.id, requestId))

  await writeAuditLog({
    userId:   adminUserId,
    action:   'refund.approved',
    entity:   'refund_request',
    entityId: requestId,
    meta:     { adminNote },
  })
}

export async function rejectRefund(
  requestId: string,
  adminUserId: string,
  reason: string,
  adminNote?: string,
) {
  const now = new Date()
  await db
    .update(refundRequest)
    .set({
      status:     'rejected',
      adminNote:  adminNote ?? reason,
      reviewedBy: adminUserId,
      reviewedAt: now,
      updatedAt:  now,
    })
    .where(eq(refundRequest.id, requestId))

  await writeAuditLog({
    userId:   adminUserId,
    action:   'refund.rejected',
    entity:   'refund_request',
    entityId: requestId,
    meta:     { reason, adminNote },
  })
}

export async function processRefund(requestId: string, adminUserId: string, adminNote?: string) {
  const now = new Date()
  await db
    .update(refundRequest)
    .set({
      status:     'processed',
      adminNote:  adminNote ?? null,
      reviewedBy: adminUserId,
      reviewedAt: now,
      updatedAt:  now,
    })
    .where(eq(refundRequest.id, requestId))

  await writeAuditLog({
    userId:   adminUserId,
    action:   'refund.processed',
    entity:   'refund_request',
    entityId: requestId,
    meta:     { adminNote },
  })
}
