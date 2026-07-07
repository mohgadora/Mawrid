/**
 * lib/audit.ts — كتابة سجل التدقيق.
 */
import 'server-only'
import { db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'

export async function writeAuditLog(params: {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  ip?: string | null
  meta?: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    id:        crypto.randomUUID(),
    userId:    params.userId ?? null,
    action:    params.action,
    entity:    params.entity,
    entityId:  params.entityId ?? null,
    ip:        params.ip ?? null,
    diff:      params.meta ?? {},
    createdAt: new Date(),
  })
}
