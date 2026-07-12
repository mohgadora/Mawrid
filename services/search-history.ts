/**
 * services/search-history.ts — سجل البحث الأخير والبحث الشائع.
 * التتبّع آمن للفشل — لا يُعطّل البحث نفسه.
 */
import 'server-only'
import { db } from '@/lib/db'
import { recentSearch } from '@/lib/db/schema'
import { eq, desc, sql, gte, and, isNotNull } from 'drizzle-orm'

/** يسجّل عملية بحث (idempotency ليست مطلوبة — نحتفظ بالتاريخ). */
export async function recordSearch(query: string, resultCount: number, userId?: string | null): Promise<void> {
  const q = String(query ?? '').trim().slice(0, 120)
  if (q.length < 2) return
  try {
    await db.insert(recentSearch).values({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      query: q,
      resultCount: Math.max(0, Math.trunc(resultCount) || 0),
    })
  } catch (err) {
    console.error('[search-history] record failed:', err)
  }
}

/** آخر عمليات بحث فريدة للمستخدم. */
export async function getRecentSearches(userId: string, limit = 8): Promise<string[]> {
  const rows = await db
    .select({ query: recentSearch.query, at: sql<string>`MAX(${recentSearch.createdAt})`.as('at') })
    .from(recentSearch)
    .where(eq(recentSearch.userId, userId))
    .groupBy(recentSearch.query)
    .orderBy(desc(sql`MAX(${recentSearch.createdAt})`))
    .limit(limit)
  return rows.map((r) => r.query)
}

/** أكثر عبارات البحث تكراراً خلال آخر 30 يوماً (تُرجع نتائج فقط). */
export async function getPopularSearches(limit = 8): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select({ query: recentSearch.query, n: sql<number>`COUNT(*)`.as('n') })
    .from(recentSearch)
    .where(and(gte(recentSearch.createdAt, since), isNotNull(recentSearch.query)))
    .groupBy(recentSearch.query)
    .having(sql`COUNT(*) >= 1`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit)
  return rows.map((r) => r.query)
}
