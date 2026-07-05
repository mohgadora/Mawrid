/**
 * services/loyalty.ts — Loyalty points service (server-only).
 */
import 'server-only'
import { db } from '@/lib/db'
import { loyaltyAccount, loyaltyTransaction, user } from '@/lib/db/schema'
import { eq, desc, sum, count } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'

// ── Helpers ───────────────────────────────────────────────────────────────

function newId() {
  return crypto.randomUUID()
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Upsert and return the loyalty account for a user. */
export async function getLoyaltyAccount(userId: string) {
  const existing = await db
    .select()
    .from(loyaltyAccount)
    .where(eq(loyaltyAccount.userId, userId))
    .limit(1)

  if (existing.length) return existing[0]

  const id = newId()
  await db.insert(loyaltyAccount).values({ id, userId })
  return (await db.select().from(loyaltyAccount).where(eq(loyaltyAccount.id, id)).limit(1))[0]
}

/** Earn points atomically; logs an audit entry. */
export async function earnPoints(
  userId: string,
  points: number,
  orderId?: string,
  note?: string,
) {
  if (points <= 0) throw new Error('points must be positive')
  return db.transaction(async (tx) => {
    // Upsert account inside transaction
    let [acct] = await tx
      .select()
      .from(loyaltyAccount)
      .where(eq(loyaltyAccount.userId, userId))
      .limit(1)

    if (!acct) {
      const id = newId()
      await tx.insert(loyaltyAccount).values({ id, userId });
      [acct] = await tx.select().from(loyaltyAccount).where(eq(loyaltyAccount.id, id)).limit(1)
    }

    const balanceBefore = acct.balance
    const balanceAfter = balanceBefore + points

    await tx
      .update(loyaltyAccount)
      .set({
        balance:        balanceAfter,
        lifetimeEarned: acct.lifetimeEarned + points,
        updatedAt:      new Date(),
      })
      .where(eq(loyaltyAccount.id, acct.id))

    const txId = newId()
    await tx.insert(loyaltyTransaction).values({
      id:            txId,
      userId,
      orderId:       orderId ?? null,
      type:          'earn',
      points,
      balanceBefore,
      balanceAfter,
      note:          note ?? null,
      createdAt:     new Date(),
    })

    await writeAuditLog({
      userId,
      action:   'loyalty.earn',
      entity:   'loyalty_account',
      entityId: acct.id,
      meta:     { points, orderId, balanceBefore, balanceAfter },
    })

    return { balance: balanceAfter, transactionId: txId }
  })
}

/** Redeem points atomically; throws if insufficient balance. */
export async function redeemPoints(
  userId: string,
  points: number,
  orderId?: string,
  note?: string,
) {
  if (points <= 0) throw new Error('points must be positive')
  return db.transaction(async (tx) => {
    const [acct] = await tx
      .select()
      .from(loyaltyAccount)
      .where(eq(loyaltyAccount.userId, userId))
      .limit(1)

    if (!acct || acct.balance < points) {
      throw new Error('رصيد النقاط غير كافٍ')
    }

    const balanceBefore = acct.balance
    const balanceAfter = balanceBefore - points

    await tx
      .update(loyaltyAccount)
      .set({
        balance:          balanceAfter,
        lifetimeRedeemed: acct.lifetimeRedeemed + points,
        updatedAt:        new Date(),
      })
      .where(eq(loyaltyAccount.id, acct.id))

    const txId = newId()
    await tx.insert(loyaltyTransaction).values({
      id:            txId,
      userId,
      orderId:       orderId ?? null,
      type:          'redeem',
      points:        -points,
      balanceBefore,
      balanceAfter,
      note:          note ?? null,
      createdAt:     new Date(),
    })

    await writeAuditLog({
      userId,
      action:   'loyalty.redeem',
      entity:   'loyalty_account',
      entityId: acct.id,
      meta:     { points, orderId, balanceBefore, balanceAfter },
    })

    return { balance: balanceAfter, transactionId: txId }
  })
}

/** Admin manual adjustment (positive or negative delta). */
export async function adjustPoints(
  userId: string,
  delta: number,
  adminUserId: string,
  note: string,
) {
  if (delta === 0) throw new Error('delta must be non-zero')
  return db.transaction(async (tx) => {
    let [acct] = await tx
      .select()
      .from(loyaltyAccount)
      .where(eq(loyaltyAccount.userId, userId))
      .limit(1)

    if (!acct) {
      const id = newId()
      await tx.insert(loyaltyAccount).values({ id, userId });
      [acct] = await tx.select().from(loyaltyAccount).where(eq(loyaltyAccount.id, id)).limit(1)
    }

    const balanceBefore = acct.balance
    const balanceAfter = Math.max(0, balanceBefore + delta)

    const updateSet: Record<string, unknown> = {
      balance:   balanceAfter,
      updatedAt: new Date(),
    }
    if (delta > 0) {
      updateSet.lifetimeEarned = acct.lifetimeEarned + delta
    }

    await tx
      .update(loyaltyAccount)
      .set(updateSet)
      .where(eq(loyaltyAccount.id, acct.id))

    const txId = newId()
    await tx.insert(loyaltyTransaction).values({
      id:            txId,
      userId,
      orderId:       null,
      type:          'adjust',
      points:        delta,
      balanceBefore,
      balanceAfter,
      note:          note ?? null,
      createdAt:     new Date(),
    })

    await writeAuditLog({
      userId:   adminUserId,
      action:   'loyalty.adjust',
      entity:   'loyalty_account',
      entityId: acct.id,
      meta:     { targetUserId: userId, delta, balanceBefore, balanceAfter, note },
    })

    return { balance: balanceAfter, transactionId: txId }
  })
}

/** List loyalty transactions for a user (newest first). */
export async function getLoyaltyTransactions(userId: string, limit = 50) {
  return db
    .select()
    .from(loyaltyTransaction)
    .where(eq(loyaltyTransaction.userId, userId))
    .orderBy(desc(loyaltyTransaction.createdAt))
    .limit(limit)
}

/** Admin summary aggregates. */
export async function getAdminLoyaltySummary() {
  const [row] = await db
    .select({
      totalAccounts:      count(loyaltyAccount.id),
      totalBalance:       sum(loyaltyAccount.balance),
      totalEarned:        sum(loyaltyAccount.lifetimeEarned),
      totalRedeemed:      sum(loyaltyAccount.lifetimeRedeemed),
    })
    .from(loyaltyAccount)

  return {
    totalAccounts:  Number(row?.totalAccounts ?? 0),
    totalBalance:   Number(row?.totalBalance ?? 0),
    totalEarned:    Number(row?.totalEarned ?? 0),
    totalRedeemed:  Number(row?.totalRedeemed ?? 0),
  }
}

/** Admin table: loyalty accounts joined with user info, ordered by balance desc, limit 200. */
export async function getAdminLoyaltyAccounts() {
  const rows = await db
    .select({
      id:               loyaltyAccount.id,
      userId:           loyaltyAccount.userId,
      balance:          loyaltyAccount.balance,
      lifetimeEarned:   loyaltyAccount.lifetimeEarned,
      lifetimeRedeemed: loyaltyAccount.lifetimeRedeemed,
      updatedAt:        loyaltyAccount.updatedAt,
      userName:         user.name,
      userEmail:        user.email,
    })
    .from(loyaltyAccount)
    .innerJoin(user, eq(loyaltyAccount.userId, user.id))
    .orderBy(desc(loyaltyAccount.balance))
    .limit(200)

  return rows
}

export type AdminLoyaltySummary = Awaited<ReturnType<typeof getAdminLoyaltySummary>>
export type AdminLoyaltyAccount = Awaited<ReturnType<typeof getAdminLoyaltyAccounts>>[number]
