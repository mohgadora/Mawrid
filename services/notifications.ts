import 'server-only'
import { db } from '@/lib/db'
import { notification, user } from '@/lib/db/schema'
import { eq, desc, and, count } from 'drizzle-orm'

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  const id = crypto.randomUUID()
  await db.insert(notification).values({ id, userId, type, title, body, link: link ?? null, read: false })
  return id
}

export async function getUserNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(limit)
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
}

export async function markAllRead(userId: string) {
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, userId), eq(notification.read, false)))
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notification)
    .where(and(eq(notification.userId, userId), eq(notification.read, false)))
  return result[0]?.count ?? 0
}

export async function deleteNotification(notificationId: string, userId: string) {
  await db
    .delete(notification)
    .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
}

export async function broadcastNotification(
  type: string,
  title: string,
  body: string,
  link?: string,
  userIds?: string[],
) {
  let targetUserIds = userIds
  if (!targetUserIds || targetUserIds.length === 0) {
    // Fetch in pages to avoid materialising the entire user table at once
    const PAGE = 500
    let offset = 0
    targetUserIds = []
    while (true) {
      const page = await db.select({ id: user.id }).from(user).limit(PAGE).offset(offset)
      if (!page.length) break
      targetUserIds.push(...page.map((u) => u.id))
      if (page.length < PAGE) break
      offset += PAGE
    }
  }
  if (targetUserIds.length === 0) return
  const rows = targetUserIds.map((userId) => ({
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    body,
    link: link ?? null,
    read: false,
  }))
  // batch in chunks of 100
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(notification).values(rows.slice(i, i + 100))
  }
}
