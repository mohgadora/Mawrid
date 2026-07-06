import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { kycApproval } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getApiUser, ok, unauthorized, apiError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  try {
    const [row] = await db
      .select()
      .from(kycApproval)
      .where(and(eq(kycApproval.userId, user.id), eq(kycApproval.type, 'supplier')))
      .orderBy(desc(kycApproval.submittedAt))
      .limit(1)

    return ok(row ?? null)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json() as { crNumber?: string; vatNumber?: string; documents?: string[] }

    const [existing] = await db
      .select()
      .from(kycApproval)
      .where(and(eq(kycApproval.userId, user.id), eq(kycApproval.type, 'supplier')))
      .orderBy(desc(kycApproval.submittedAt))
      .limit(1)

    if (existing) {
      const [updated] = await db
        .update(kycApproval)
        .set({
          crNumber: body.crNumber ?? existing.crNumber,
          vatNumber: body.vatNumber ?? existing.vatNumber,
          documents: body.documents ?? existing.documents,
          status: 'pending',
          submittedAt: new Date(),
        })
        .where(eq(kycApproval.id, existing.id))
        .returning()
      return ok(updated)
    } else {
      const [inserted] = await db
        .insert(kycApproval)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          type: 'supplier',
          status: 'pending',
          crNumber: body.crNumber ?? null,
          vatNumber: body.vatNumber ?? null,
          documents: body.documents ?? [],
          submittedAt: new Date(),
        })
        .returning()
      return ok(inserted)
    }
  } catch (err) {
    return apiError(err)
  }
}
