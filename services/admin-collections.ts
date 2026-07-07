import 'server-only'
import { db } from '@/lib/db'
import { adminCollection } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'
import { isAllowedCollectionKey } from '@/lib/admin-collection-keys'
import { writeAuditLog } from '@/lib/audit'

export async function getAdminCollectionItems<T extends { id: number }>(key: string): Promise<T[]> {
  if (!isAllowedCollectionKey(key)) throw new ValidationError('مجموعة غير مسموحة')
  const [row] = await db.select().from(adminCollection).where(eq(adminCollection.key, key))
  if (!row) return []
  return (row.items as T[]) ?? []
}

export async function saveAdminCollectionItems<T extends { id: number }>(
  key: string,
  items: T[],
  adminUserId?: string,
): Promise<T[]> {
  if (!isAllowedCollectionKey(key)) throw new ValidationError('مجموعة غير مسموحة')

  const [existing] = await db.select().from(adminCollection).where(eq(adminCollection.key, key))
  if (existing) {
    await db
      .update(adminCollection)
      .set({ items: items as unknown[], updatedAt: new Date() })
      .where(eq(adminCollection.key, key))
  } else {
    await db.insert(adminCollection).values({
      key,
      items: items as unknown[],
      updatedAt: new Date(),
    })
  }

  await writeAuditLog({
    userId: adminUserId ?? null,
    action: 'admin_collection.updated',
    entity: 'admin_collection',
    entityId: key,
    meta: { count: items.length },
  })

  return items
}
