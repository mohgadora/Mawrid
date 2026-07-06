/**
 * services/wallet.ts — Digital Wallet data layer.
 *
 * محفظة رقمية لكل مستخدم مع دفتر عمليات كامل. كل تعديل على الرصيد ذرّي: يقفل صف
 * المحفظة (SELECT ... FOR UPDATE) داخل معاملة قبل الحساب، فلا تتسرّب أرصدة عند
 * الطلبات المتزامنة. كل المبالغ بالدولار (USD) وتُحسب بالسنتات عبر lib/money.ts.
 */
import 'server-only'
import { db } from '@/lib/db'
import { wallet, walletTransaction, walletBonusRule } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { toCents, fromCents } from '@/lib/money'
import { topupBonusUsd } from '@/lib/discounts'

type DbWallet = typeof wallet.$inferSelect
type DbWalletTx = typeof walletTransaction.$inferSelect
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type WalletTxType =
  | 'topup' | 'purchase' | 'refund' | 'bonus'
  | 'loyalty_convert' | 'cashback' | 'admin_credit' | 'admin_debit'

/** يقفل صف محفظة المستخدم داخل معاملة (وينشئها إن لم توجد). */
async function lockWallet(tx: Tx, userId: string): Promise<DbWallet> {
  await tx
    .insert(wallet)
    .values({ id: crypto.randomUUID(), userId })
    .onConflictDoNothing({ target: wallet.userId })
  const [row] = await tx.select().from(wallet).where(eq(wallet.userId, userId)).for('update').limit(1)
  if (!row) throw new NotFoundError('تعذّر تجهيز المحفظة')
  return row
}

/**
 * يطبّق تغييراً موقّعاً على الرصيد داخل معاملة قائمة (amountUsd موجب = إيداع،
 * سالب = سحب) ويسجّل سطراً في الدفتر. يرمي خطأ إن كان السحب أكبر من الرصيد.
 * صالح للاستدعاء من معاملة الطلب لضمان الذرّية عبر العمليتين.
 */
export async function walletDeltaTx(
  tx: Tx,
  userId: string,
  params: { amountUsd: number; type: WalletTxType; reference?: string; note?: string; createdBy?: string },
): Promise<number> {
  const amountCents = toCents(params.amountUsd)
  if (amountCents === 0) throw new ValidationError('قيمة العملية يجب ألا تكون صفراً')

  const row = await lockWallet(tx, userId)
  const balanceCents = toCents(Number(row.balance))
  const nextCents = balanceCents + amountCents
  if (nextCents < 0) throw new ValidationError('الرصيد غير كافٍ في المحفظة')

  const nextBalanceUsd = fromCents(nextCents)
  const lifetimeCredit = toCents(Number(row.lifetimeCredit)) + (amountCents > 0 ? amountCents : 0)
  const lifetimeDebit = toCents(Number(row.lifetimeDebit)) + (amountCents < 0 ? -amountCents : 0)

  await tx
    .update(wallet)
    .set({
      balance: nextBalanceUsd.toFixed(2),
      lifetimeCredit: fromCents(lifetimeCredit).toFixed(2),
      lifetimeDebit: fromCents(lifetimeDebit).toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(wallet.id, row.id))

  await tx.insert(walletTransaction).values({
    id: crypto.randomUUID(),
    walletId: row.id,
    type: params.type,
    amount: fromCents(amountCents).toFixed(2),
    balanceAfter: nextBalanceUsd.toFixed(2),
    reference: params.reference ?? null,
    note: params.note ?? null,
    createdBy: params.createdBy ?? userId,
  })

  return nextBalanceUsd
}

export async function getOrCreateWallet(userId: string): Promise<DbWallet> {
  const [existing] = await db.select().from(wallet).where(eq(wallet.userId, userId)).limit(1)
  if (existing) return existing
  await db
    .insert(wallet)
    .values({ id: crypto.randomUUID(), userId })
    .onConflictDoNothing({ target: wallet.userId })
  const [row] = await db.select().from(wallet).where(eq(wallet.userId, userId)).limit(1)
  return row
}

export async function getBalance(userId: string): Promise<number> {
  const w = await getOrCreateWallet(userId)
  return Number(w.balance)
}

export async function getTransactions(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: DbWalletTx[]; total: number; page: number; pageSize: number }> {
  const w = await getOrCreateWallet(userId)
  const [totalRow] = await db
    .select({ n: count() })
    .from(walletTransaction)
    .where(eq(walletTransaction.walletId, w.id))
  const items = await db
    .select()
    .from(walletTransaction)
    .where(eq(walletTransaction.walletId, w.id))
    .orderBy(desc(walletTransaction.createdAt))
    .limit(pageSize)
    .offset(Math.max(0, (page - 1) * pageSize))
  return { items, total: totalRow?.n ?? 0, page, pageSize }
}

/** يحسب أفضل بونص شحن مؤهّل من قواعد wallet_bonus_rule. */
export async function calculateBonus(amountUsd: number): Promise<number> {
  const now = new Date()
  const rules = await db.select().from(walletBonusRule).where(eq(walletBonusRule.active, true))
  let best = 0
  for (const r of rules) {
    if (r.startsAt && r.startsAt.getTime() > now.getTime()) continue
    if (r.expiresAt && r.expiresAt.getTime() < now.getTime()) continue
    if (amountUsd < Number(r.minTopup)) continue
    const bonus = topupBonusUsd(
      r.bonusType === 'percent' ? 'percent' : 'fixed',
      Number(r.bonusValue),
      amountUsd,
      r.maxBonus != null ? Number(r.maxBonus) : null,
    )
    best = Math.max(best, bonus)
  }
  return best
}

/** شحن المحفظة + تطبيق البونص إن وُجد. يُرجع الرصيد الجديد وقيمة البونص. */
export async function topup(
  userId: string,
  amountUsd: number,
  method = 'manual',
): Promise<{ balance: number; bonus: number }> {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new ValidationError('قيمة الشحن غير صالحة')
  const bonus = await calculateBonus(amountUsd)

  let balance = 0
  await db.transaction(async (tx) => {
    balance = await walletDeltaTx(tx, userId, {
      amountUsd,
      type: 'topup',
      reference: method,
      note: `شحن المحفظة (${method})`,
    })
    if (bonus > 0) {
      balance = await walletDeltaTx(tx, userId, {
        amountUsd: bonus,
        type: 'bonus',
        reference: method,
        note: 'بونص شحن',
      })
    }
  })
  await writeAuditLog({ userId, action: 'wallet.topup', entity: 'wallet', entityId: userId, meta: { amountUsd, bonus } })
  return { balance, bonus }
}

/** سحب من المحفظة (ذرّي). type افتراضياً purchase. */
export async function debit(
  userId: string,
  amountUsd: number,
  reference: string,
  type: WalletTxType = 'purchase',
  note?: string,
): Promise<number> {
  return db.transaction((tx) =>
    walletDeltaTx(tx, userId, { amountUsd: -Math.abs(amountUsd), type, reference, note }),
  )
}

/** إيداع في المحفظة (refund / cashback / bonus / loyalty_convert). */
export async function credit(
  userId: string,
  amountUsd: number,
  reference: string,
  type: WalletTxType,
  note?: string,
  createdBy?: string,
): Promise<number> {
  return db.transaction((tx) =>
    walletDeltaTx(tx, userId, { amountUsd: Math.abs(amountUsd), type, reference, note, createdBy }),
  )
}

/** تعديل يدوي من الأدمن (موجب = شحن، سالب = خصم). */
export async function adminAdjustBalance(
  adminId: string,
  userId: string,
  amountUsd: number,
  note?: string,
): Promise<number> {
  if (!Number.isFinite(amountUsd) || amountUsd === 0) throw new ValidationError('قيمة التعديل غير صالحة')
  const type: WalletTxType = amountUsd > 0 ? 'admin_credit' : 'admin_debit'
  const balance = await db.transaction((tx) =>
    walletDeltaTx(tx, userId, { amountUsd, type, reference: 'admin', note, createdBy: adminId }),
  )
  await writeAuditLog({ userId: adminId, action: 'wallet.admin_adjust', entity: 'wallet', entityId: userId, meta: { amountUsd, note } })
  return balance
}

// ═══════════════════════════════════════════════════════════════════════════
// قواعد بونص الشحن (أدمن)
// ═══════════════════════════════════════════════════════════════════════════

export async function listBonusRules(): Promise<(typeof walletBonusRule.$inferSelect)[]> {
  return db.select().from(walletBonusRule).orderBy(desc(walletBonusRule.createdAt)).limit(100)
}

export type BonusRuleInput = {
  minTopup: number
  bonusType: string
  bonusValue: number
  maxBonus?: number | null
  active?: boolean
  startsAt?: string | null
  expiresAt?: string | null
}

function validateBonusRule(data: BonusRuleInput) {
  if (!Number.isFinite(data.minTopup) || data.minTopup < 0) throw new ValidationError('الحد الأدنى للشحن غير صالح')
  if (data.bonusType !== 'percent' && data.bonusType !== 'fixed') throw new ValidationError('نوع البونص غير صالح')
  if (!Number.isFinite(data.bonusValue) || data.bonusValue <= 0) throw new ValidationError('قيمة البونص يجب أن تكون أكبر من صفر')
  if (data.bonusType === 'percent' && data.bonusValue > 100) throw new ValidationError('نسبة البونص يجب أن تكون 100% أو أقل')
}

export async function createBonusRule(data: BonusRuleInput, adminId: string) {
  validateBonusRule(data)
  const [row] = await db
    .insert(walletBonusRule)
    .values({
      id: crypto.randomUUID(),
      minTopup: String(data.minTopup),
      bonusType: data.bonusType,
      bonusValue: String(data.bonusValue),
      maxBonus: data.maxBonus != null ? String(data.maxBonus) : null,
      active: data.active ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'wallet_bonus.create', entity: 'wallet_bonus_rule', entityId: row.id })
  return row
}

export async function updateBonusRule(id: string, data: Partial<BonusRuleInput>, adminId: string) {
  const set: Record<string, unknown> = {}
  if (data.minTopup !== undefined) set.minTopup = String(data.minTopup)
  if (data.bonusType !== undefined) set.bonusType = data.bonusType
  if (data.bonusValue !== undefined) set.bonusValue = String(data.bonusValue)
  if ('maxBonus' in data) set.maxBonus = data.maxBonus != null ? String(data.maxBonus) : null
  if (data.active !== undefined) set.active = data.active
  if ('startsAt' in data) set.startsAt = data.startsAt ? new Date(data.startsAt) : null
  if ('expiresAt' in data) set.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  const [row] = await db.update(walletBonusRule).set(set).where(eq(walletBonusRule.id, id)).returning()
  if (!row) throw new NotFoundError('القاعدة غير موجودة')
  await writeAuditLog({ userId: adminId, action: 'wallet_bonus.update', entity: 'wallet_bonus_rule', entityId: id })
  return row
}

export async function deleteBonusRule(id: string, adminId: string) {
  await db.delete(walletBonusRule).where(eq(walletBonusRule.id, id))
  await writeAuditLog({ userId: adminId, action: 'wallet_bonus.delete', entity: 'wallet_bonus_rule', entityId: id })
}

// ═══════════════════════════════════════════════════════════════════════════
// أدمن — بحث عن محفظة مستخدم
// ═══════════════════════════════════════════════════════════════════════════

export async function adminGetUserWallet(userId: string) {
  const w = await getOrCreateWallet(userId)
  const txns = await db
    .select()
    .from(walletTransaction)
    .where(eq(walletTransaction.walletId, w.id))
    .orderBy(desc(walletTransaction.createdAt))
    .limit(50)
  return { wallet: w, transactions: txns }
}
