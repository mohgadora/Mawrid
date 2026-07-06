/**
 * services/cashback.ts — CashBack rules + awarding.
 *
 * يمنح المشتري استرجاعاً نقدياً في محفظته بعد تسليم الطلب. القاعدة الأعلى قيمةً
 * المؤهّلة هي التي تُطبَّق. كل المبالغ بالدولار وتُحسب بالسنتات عبر lib/money.ts.
 */
import 'server-only'
import { db } from '@/lib/db'
import { cashbackRule, order, orderLine, product, walletTransaction, wallet } from '@/lib/db/schema'
import { eq, and, desc, inArray, count } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { toCents, fromCents } from '@/lib/money'
import { credit } from '@/services/wallet'

type DbRule = typeof cashbackRule.$inferSelect

function cashbackForRule(rule: DbRule, orderTotalUsd: number): number {
  const totalCents = toCents(orderTotalUsd)
  let cents: number
  if (rule.type === 'percent') {
    cents = Math.round((totalCents * Number(rule.value)) / 100)
  } else {
    cents = toCents(Number(rule.value))
  }
  if (rule.maxCashback != null) cents = Math.min(cents, toCents(Number(rule.maxCashback)))
  cents = Math.max(0, Math.min(cents, totalCents))
  return fromCents(cents)
}

async function isFirstOrder(userId: string, excludeOrderId?: string): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(order).where(eq(order.userId, userId))
  // الطلب الحالي مُحتسَب ضمن العدّ؛ أول طلب = طلب واحد فقط
  const total = row?.n ?? 0
  return excludeOrderId ? total <= 1 : total === 0
}

async function ruleMatchesScope(rule: DbRule, productIds: string[]): Promise<boolean> {
  if (rule.scope === 'global' || rule.scope === 'first_order') return true
  if (!productIds.length) return false
  const rows = await db
    .select({ id: product.id, supplierId: product.supplierId, categoryId: product.categoryId })
    .from(product)
    .where(inArray(product.id, productIds))
  const scopeIds = new Set(((rule.scopeIds as string[] | null) ?? []).map(String))
  if (rule.scope === 'supplier') return rows.some((r) => r.supplierId && scopeIds.has(r.supplierId))
  if (rule.scope === 'category') return rows.some((r) => r.categoryId && scopeIds.has(r.categoryId))
  return true
}

/** أعلى استرجاع مؤهّل لطلب. يُرجع القيمة بالدولار (0 إن لا شيء). */
export async function calculateCashback(
  orderTotalUsd: number,
  userId: string,
  productIds: string[],
  opts: { excludeOrderId?: string } = {},
): Promise<number> {
  const now = new Date()
  const rules = await db.select().from(cashbackRule).where(eq(cashbackRule.active, true))
  let best = 0
  let firstOrderChecked: boolean | null = null

  for (const rule of rules) {
    if (rule.startsAt && rule.startsAt.getTime() > now.getTime()) continue
    if (rule.expiresAt && rule.expiresAt.getTime() < now.getTime()) continue
    if (orderTotalUsd < Number(rule.minOrderAmount)) continue
    if (rule.scope === 'first_order') {
      if (firstOrderChecked === null) firstOrderChecked = await isFirstOrder(userId, opts.excludeOrderId)
      if (!firstOrderChecked) continue
    }
    if (!(await ruleMatchesScope(rule, productIds))) continue
    best = Math.max(best, cashbackForRule(rule, orderTotalUsd))
  }
  return best
}

/**
 * يمنح الاسترجاع لطلب مُسلَّم (idempotent — لا يُكرَّر إن وُجد سطر cashback
 * بنفس الطلب في دفتر المحفظة).
 */
export async function awardCashbackForOrder(orderId: string): Promise<number> {
  const [row] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
  if (!row) throw new NotFoundError('الطلب غير موجود')
  if (row.status !== 'delivered') return 0
  if (!row.userId) return 0 // طلبات الضيوف لا تملك محفظة/استرجاع

  // idempotency: تحقّق من عدم منح استرجاع لهذا الطلب سابقاً
  const [w] = await db.select({ id: wallet.id }).from(wallet).where(eq(wallet.userId, row.userId)).limit(1)
  if (w) {
    const [dup] = await db
      .select({ id: walletTransaction.id })
      .from(walletTransaction)
      .where(and(
        eq(walletTransaction.walletId, w.id),
        eq(walletTransaction.type, 'cashback'),
        eq(walletTransaction.reference, orderId),
      ))
      .limit(1)
    if (dup) return 0
  }

  const lines = await db.select({ productId: orderLine.productId }).from(orderLine).where(eq(orderLine.orderId, orderId))
  const productIds = [...new Set(lines.map((l) => l.productId).filter((id): id is string => Boolean(id)))]

  const amount = await calculateCashback(Number(row.total), row.userId, productIds, { excludeOrderId: orderId })
  if (amount <= 0) return 0

  await credit(row.userId, amount, orderId, 'cashback', `استرجاع طلب ${row.ref}`, 'system')
  await writeAuditLog({ userId: row.userId, action: 'cashback.award', entity: 'order', entityId: orderId, meta: { amount } })
  return amount
}

// ═══════════════════════════════════════════════════════════════════════════
// أدمن — إدارة قواعد الاسترجاع
// ═══════════════════════════════════════════════════════════════════════════

export async function listCashbackRules(): Promise<DbRule[]> {
  return db.select().from(cashbackRule).orderBy(desc(cashbackRule.createdAt)).limit(200)
}

export type CashbackRuleInput = {
  type: string
  value: number
  maxCashback?: number | null
  minOrderAmount?: number
  scope?: string
  scopeIds?: string[]
  titleAr?: string | null
  titleEn?: string | null
  active?: boolean
  startsAt?: string | null
  expiresAt?: string | null
}

function validateRule(data: CashbackRuleInput) {
  if (data.type !== 'percent' && data.type !== 'fixed') throw new ValidationError('نوع الاسترجاع غير صالح')
  if (!Number.isFinite(data.value) || data.value <= 0) throw new ValidationError('قيمة الاسترجاع يجب أن تكون أكبر من صفر')
  if (data.type === 'percent' && data.value > 100) throw new ValidationError('نسبة الاسترجاع يجب أن تكون 100% أو أقل')
}

export async function createCashbackRule(data: CashbackRuleInput, adminId: string) {
  validateRule(data)
  const [rrow] = await db
    .insert(cashbackRule)
    .values({
      id: crypto.randomUUID(),
      type: data.type,
      value: String(data.value),
      maxCashback: data.maxCashback != null ? String(data.maxCashback) : null,
      minOrderAmount: String(data.minOrderAmount ?? 0),
      scope: data.scope ?? 'global',
      scopeIds: data.scopeIds ?? [],
      titleAr: data.titleAr ?? null,
      titleEn: data.titleEn ?? null,
      active: data.active ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'cashback_rule.create', entity: 'cashback_rule', entityId: rrow.id })
  return rrow
}

export async function updateCashbackRule(id: string, data: Partial<CashbackRuleInput>, adminId: string) {
  const set: Record<string, unknown> = {}
  if (data.type !== undefined) set.type = data.type
  if (data.value !== undefined) set.value = String(data.value)
  if ('maxCashback' in data) set.maxCashback = data.maxCashback != null ? String(data.maxCashback) : null
  if (data.minOrderAmount !== undefined) set.minOrderAmount = String(data.minOrderAmount)
  if (data.scope !== undefined) set.scope = data.scope
  if (data.scopeIds !== undefined) set.scopeIds = data.scopeIds
  if ('titleAr' in data) set.titleAr = data.titleAr ?? null
  if ('titleEn' in data) set.titleEn = data.titleEn ?? null
  if (data.active !== undefined) set.active = data.active
  if ('startsAt' in data) set.startsAt = data.startsAt ? new Date(data.startsAt) : null
  if ('expiresAt' in data) set.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  const [rrow] = await db.update(cashbackRule).set(set).where(eq(cashbackRule.id, id)).returning()
  if (!rrow) throw new NotFoundError('القاعدة غير موجودة')
  await writeAuditLog({ userId: adminId, action: 'cashback_rule.update', entity: 'cashback_rule', entityId: id })
  return rrow
}

export async function deleteCashbackRule(id: string, adminId: string) {
  await db.delete(cashbackRule).where(eq(cashbackRule.id, id))
  await writeAuditLog({ userId: adminId, action: 'cashback_rule.delete', entity: 'cashback_rule', entityId: id })
}
