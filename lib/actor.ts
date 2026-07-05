/**
 * lib/actor.ts — سياق المستخدم الموحّد بين route handlers والخدمات.
 */
import 'server-only'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { UnauthorizedError, ValidationError } from '@/lib/errors'
import { readImpersonation } from '@/lib/impersonation'

export type Actor = { id: string; role: string; impersonatedSupplierId?: string }

async function assertActiveUser(userId: string): Promise<void> {
  const rows = await db
    .select({ banned: user.banned, banExpires: user.banExpires })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  const row = rows[0]
  if (!row?.banned) return
  if (row.banExpires && row.banExpires.getTime() < Date.now()) return
  throw new ValidationError('تم تعليق هذا الحساب')
}

/** يحلّ المستخدم من الـ actor الممرَّر أو من الجلسة الحالية. */
export async function resolveActor(actor?: Actor): Promise<Actor> {
  if (actor) {
    await assertActiveUser(actor.id)
    return actor
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new UnauthorizedError()
  const role = (session.user as { role?: string }).role ?? 'consumer'
  const resolved: Actor = { id: session.user.id, role }
  if (role === 'admin') {
    const imp = await readImpersonation()
    if (imp) resolved.impersonatedSupplierId = imp.supplierId
  }
  await assertActiveUser(resolved.id)
  return resolved
}
