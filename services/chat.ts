/**
 * services/chat.ts — Conversations + messages data layer.
 *
 * محادثات بين المشتري والمورد/الأدمن/السائق. الاطّلاع مقيّد بالمشاركين فقط.
 * الاستطلاع (polling) من العميل كل بضع ثوانٍ؛ لا websockets بعد.
 */
import 'server-only'
import { db } from '@/lib/db'
import { conversation, chatMessage, user, order, orderLine, product, supplier } from '@/lib/db/schema'
import { eq, and, desc, asc, lt, sql, inArray, isNull, ne, count } from 'drizzle-orm'
import { ValidationError, ForbiddenError, NotFoundError } from '@/lib/errors'

type DbConversation = typeof conversation.$inferSelect
type DbMessage = typeof chatMessage.$inferSelect

const CONV_TYPES = ['buyer_supplier', 'buyer_admin', 'buyer_driver'] as const

function participantsOf(conv: DbConversation): string[] {
  return ((conv.participantIds as string[] | null) ?? []).map(String)
}

function assertParticipant(conv: DbConversation, userId: string) {
  if (!participantsOf(conv).includes(userId)) throw new ForbiddenError('لست طرفاً في هذه المحادثة')
}

/** محادثة واحدة بين نفس الأطراف (ونفس الطلب إن وُجد) أو تُنشأ. */
export async function getOrCreateConversation(
  type: string,
  participantIds: string[],
  orderId?: string | null,
): Promise<DbConversation> {
  if (!(CONV_TYPES as readonly string[]).includes(type)) throw new ValidationError('نوع محادثة غير صالح')
  const parts = [...new Set(participantIds.map((p) => String(p).trim()).filter(Boolean))].sort()
  if (parts.length < 2) throw new ValidationError('المحادثة تحتاج طرفين على الأقل')

  // ابحث عن محادثة قائمة بنفس النوع/الطلب تحتوي كل الأطراف
  const candidates = await db
    .select()
    .from(conversation)
    .where(and(
      eq(conversation.type, type),
      sql`${conversation.participantIds} @> ${JSON.stringify(parts)}::jsonb`,
    ))
  const existing = candidates.find((c) => {
    const cp = participantsOf(c).sort()
    const sameParts = cp.length === parts.length && cp.every((x, i) => x === parts[i])
    const sameOrder = (c.orderId ?? null) === (orderId ?? null)
    return sameParts && sameOrder
  })
  if (existing) return existing

  const [row] = await db
    .insert(conversation)
    .values({
      id: crypto.randomUUID(),
      type,
      orderId: orderId ?? null,
      participantIds: parts,
      lastMessageAt: null,
    })
    .returning()
  return row
}

/**
 * يبدأ (أو يُرجع) محادثة بين مشتري الطلب ومورّده. يتحقق أن المستخدم صاحب الطلب،
 * ويحلّ حساب المورد من أصناف الطلب.
 */
export async function startOrderConversation(userId: string, orderId: string): Promise<DbConversation> {
  const [ord] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
  if (!ord) throw new NotFoundError('الطلب غير موجود')
  if (ord.userId !== userId) throw new ForbiddenError('لا تملك هذا الطلب')

  // حساب المورد: من order.supplierId أو من أصناف الطلب
  let supplierId = ord.supplierId ?? null
  if (!supplierId) {
    const lines = await db
      .select({ supplierId: product.supplierId })
      .from(orderLine)
      .innerJoin(product, eq(orderLine.productId, product.id))
      .where(eq(orderLine.orderId, orderId))
      .limit(1)
    supplierId = lines[0]?.supplierId ?? null
  }
  if (!supplierId) throw new ValidationError('لا يمكن تحديد مورد هذا الطلب')

  const [sup] = await db.select({ userId: supplier.userId }).from(supplier).where(eq(supplier.id, supplierId)).limit(1)
  if (!sup?.userId) throw new ValidationError('حساب المورد غير متاح للمحادثة')

  return getOrCreateConversation('buyer_supplier', [userId, sup.userId], orderId)
}

export async function getConversation(conversationId: string, userId: string): Promise<DbConversation> {
  const [conv] = await db.select().from(conversation).where(eq(conversation.id, conversationId)).limit(1)
  if (!conv) throw new NotFoundError('المحادثة غير موجودة')
  assertParticipant(conv, userId)
  return conv
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  images: string[] = [],
): Promise<DbMessage> {
  const text = String(body ?? '').trim()
  if (!text) throw new ValidationError('الرسالة فارغة')
  if (text.length > 4000) throw new ValidationError('الرسالة طويلة جداً')

  const conv = await getConversation(conversationId, senderId)

  const [msg] = await db
    .insert(chatMessage)
    .values({
      id: crypto.randomUUID(),
      conversationId: conv.id,
      senderId,
      body: text,
      images: Array.isArray(images) ? images.slice(0, 4).map(String) : [],
    })
    .returning()

  await db.update(conversation).set({ lastMessageAt: new Date() }).where(eq(conversation.id, conv.id))
  return msg
}

export async function getMessages(
  conversationId: string,
  userId: string,
  opts: { cursor?: string; limit?: number } = {},
): Promise<{ items: DbMessage[]; nextCursor: string | null }> {
  await getConversation(conversationId, userId)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50))
  const where = opts.cursor
    ? and(eq(chatMessage.conversationId, conversationId), lt(chatMessage.createdAt, new Date(opts.cursor)))
    : eq(chatMessage.conversationId, conversationId)

  const rows = await db
    .select()
    .from(chatMessage)
    .where(where)
    .orderBy(desc(chatMessage.createdAt))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null
  // نُعيدها تصاعدياً للعرض
  return { items: page.reverse(), nextCursor }
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  await getConversation(conversationId, userId)
  await db
    .update(chatMessage)
    .set({ readAt: new Date() })
    .where(and(
      eq(chatMessage.conversationId, conversationId),
      ne(chatMessage.senderId, userId),
      isNull(chatMessage.readAt),
    ))
}

export async function getUnreadCount(userId: string): Promise<number> {
  const convs = await db
    .select({ id: conversation.id })
    .from(conversation)
    .where(sql`${conversation.participantIds} @> ${JSON.stringify([userId])}::jsonb`)
  const ids = convs.map((c) => c.id)
  if (!ids.length) return 0
  const [row] = await db
    .select({ n: count() })
    .from(chatMessage)
    .where(and(
      inArray(chatMessage.conversationId, ids),
      ne(chatMessage.senderId, userId),
      isNull(chatMessage.readAt),
    ))
  return row?.n ?? 0
}

export type ConversationSummary = {
  id: string
  type: string
  orderId: string | null
  lastMessageAt: string | null
  lastMessage: string | null
  unread: number
  otherName: string
}

export async function getUserConversations(userId: string, page = 1): Promise<ConversationSummary[]> {
  const pageSize = 30
  const convs = await db
    .select()
    .from(conversation)
    .where(sql`${conversation.participantIds} @> ${JSON.stringify([userId])}::jsonb`)
    .orderBy(desc(conversation.lastMessageAt))
    .limit(pageSize)
    .offset(Math.max(0, (page - 1) * pageSize))

  if (!convs.length) return []
  const ids = convs.map((c) => c.id)

  // آخر رسالة لكل محادثة + عدّ غير المقروء
  const messages = await db
    .select()
    .from(chatMessage)
    .where(inArray(chatMessage.conversationId, ids))
    .orderBy(asc(chatMessage.createdAt))

  // أسماء الأطراف الآخرين
  const otherIds = [...new Set(convs.flatMap((c) => participantsOf(c).filter((p) => p !== userId)))]
  const users = otherIds.length
    ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, otherIds))
    : []
  const nameMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return convs.map((c) => {
    const msgs = messages.filter((m) => m.conversationId === c.id)
    const last = msgs[msgs.length - 1]
    const unread = msgs.filter((m) => m.senderId !== userId && !m.readAt).length
    const otherId = participantsOf(c).find((p) => p !== userId)
    return {
      id: c.id,
      type: c.type,
      orderId: c.orderId,
      lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
      lastMessage: last ? last.body : null,
      unread,
      otherName: (otherId && nameMap[otherId]) || 'مستخدم',
    }
  })
}
