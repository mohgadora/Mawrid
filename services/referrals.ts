/**
 * services/referrals.ts — Referral system service (server-only).
 */
import 'server-only'
import { buildReferralCode } from '@/lib/referral-code'
import { db } from '@/lib/db'
import { referralCode, referral, user } from '@/lib/db/schema'
import { eq, desc, count, sum, and, inArray, ne, sql } from 'drizzle-orm'
import { earnPoints } from '@/services/loyalty'
import { getSetting } from '@/lib/settings'
import { writeAuditLog } from '@/lib/audit'

function newId() {
  return crypto.randomUUID()
}

function generateCode(userId: string): string {
  return buildReferralCode(userId, Math.random().toString(36).slice(2, 6))
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Get or create a unique referral code for a user. */
export async function getOrCreateReferralCode(userId: string) {
  const existing = await db
    .select()
    .from(referralCode)
    .where(eq(referralCode.userId, userId))
    .limit(1)

  if (existing.length) return existing[0]

  // Generate a unique code
  let code = generateCode(userId)
  let attempts = 0
  while (attempts < 10) {
    const conflict = await db
      .select({ id: referralCode.id })
      .from(referralCode)
      .where(eq(referralCode.code, code))
      .limit(1)
    if (!conflict.length) break
    code = generateCode(userId) + attempts
    attempts++
  }

  const id = newId()
  await db.insert(referralCode).values({ id, userId, code })
  return (await db.select().from(referralCode).where(eq(referralCode.id, id)).limit(1))[0]
}

/**
 * Apply a referral code when a new user registers.
 * Called after account creation.
 */
export async function applyReferralCode(refereeId: string, code: string) {
  // Find the referral code row
  const [codeRow] = await db
    .select()
    .from(referralCode)
    .where(eq(referralCode.code, code.toUpperCase()))
    .limit(1)

  if (!codeRow) throw new Error('رمز الإحالة غير صالح')
  if (codeRow.userId === refereeId) throw new Error('لا يمكنك استخدام رمز الإحالة الخاص بك')

  const id = newId()
  await db.transaction(async (tx) => {
    // Re-check duplicate inside transaction to prevent TOCTOU
    const existing = await tx
      .select({ id: referral.id })
      .from(referral)
      .where(eq(referral.refereeId, refereeId))
      .limit(1)

    if (existing.length) throw new Error('تم تطبيق رمز الإحالة مسبقاً')

    await tx.insert(referral).values({
      id,
      referrerId: codeRow.userId,
      refereeId,
      code: codeRow.code,
      status: 'pending',
    })

    await tx
      .update(referralCode)
      .set({ usageCount: sql`${referralCode.usageCount} + 1` })
      .where(eq(referralCode.id, codeRow.id))
  })

  return id
}

/** Reward both referrer and referee with points. */
export async function rewardReferral(referralId: string, adminUserId?: string) {
  const [ref] = await db
    .select()
    .from(referral)
    .where(eq(referral.id, referralId))
    .limit(1)

  if (!ref) throw new Error('الإحالة غير موجودة')
  if (ref.status === 'rewarded') throw new Error('تم منح المكافأة مسبقاً')

  const referrerBonusRaw = await getSetting('referralBonusReferrer')
  const refereeBonusRaw = await getSetting('referralBonusReferee')
  const referrerBonus = Number(referrerBonusRaw) || 0
  const refereeBonus = Number(refereeBonusRaw) || 0

  // اطلب المكافأة ذرّياً: فقط أول استدعاء ينجح في قلب pending→rewarded يمنح النقاط.
  // يمنع المنح المزدوج عند النقر المتكرر أو إعادة المحاولة.
  const claimed = await db
    .update(referral)
    .set({ status: 'rewarded', referrerBonus, refereeBonus, rewardedAt: new Date() })
    .where(and(eq(referral.id, referralId), ne(referral.status, 'rewarded')))
    .returning({ id: referral.id })
  if (!claimed.length) throw new Error('تم منح المكافأة مسبقاً')

  if (referrerBonus > 0) {
    await earnPoints(ref.referrerId, referrerBonus, undefined, `مكافأة الإحالة #${referralId}`)
  }
  if (refereeBonus > 0) {
    await earnPoints(ref.refereeId, refereeBonus, undefined, `مكافأة الترحيب بالإحالة #${referralId}`)
  }

  await writeAuditLog({
    userId: adminUserId,
    action: 'referral.rewarded',
    entity: 'referral',
    entityId: referralId,
    meta: { referrerId: ref.referrerId, refereeId: ref.refereeId, referrerBonus, refereeBonus },
  })
}

/** List all referrals where this user is the referrer. */
export async function getReferralsByUser(userId: string) {
  return db
    .select()
    .from(referral)
    .where(eq(referral.referrerId, userId))
    .orderBy(desc(referral.createdAt))
}

/** Admin: all referrals with names, limited to 200. */
export async function getAdminReferrals() {
  const referrerAlias = { id: user.id, name: user.name }
  const rows = await db
    .select({
      id: referral.id,
      referrerId: referral.referrerId,
      refereeId: referral.refereeId,
      code: referral.code,
      status: referral.status,
      referrerBonus: referral.referrerBonus,
      refereeBonus: referral.refereeBonus,
      rewardedAt: referral.rewardedAt,
      createdAt: referral.createdAt,
    })
    .from(referral)
    .orderBy(desc(referral.createdAt))
    .limit(200)

  // Fetch user names separately to avoid complex join typing
  const userIds = Array.from(new Set([...rows.map(r => r.referrerId), ...rows.map(r => r.refereeId)]))
  const users = userIds.length
    ? await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(inArray(user.id, userIds))
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return rows.map(r => ({
    ...r,
    referrerName: userMap[r.referrerId]?.name ?? r.referrerId,
    refereeName: userMap[r.refereeId]?.name ?? r.refereeId,
  }))
}

/** Admin: aggregate stats. */
export async function getAdminReferralStats() {
  const [totals] = await db
    .select({
      total: count(referral.id),
    })
    .from(referral)

  const [rewarded] = await db
    .select({ count: count(referral.id) })
    .from(referral)
    .where(eq(referral.status, 'rewarded'))

  const [pending] = await db
    .select({ count: count(referral.id) })
    .from(referral)
    .where(eq(referral.status, 'pending'))

  const [bonuses] = await db
    .select({
      referrerTotal: sum(referral.referrerBonus),
      refereeTotal: sum(referral.refereeBonus),
    })
    .from(referral)
    .where(eq(referral.status, 'rewarded'))

  const totalPointsAwarded =
    (Number(bonuses?.referrerTotal) || 0) + (Number(bonuses?.refereeTotal) || 0)

  return {
    total: totals?.total ?? 0,
    rewarded: rewarded?.count ?? 0,
    pending: pending?.count ?? 0,
    totalPointsAwarded,
  }
}
