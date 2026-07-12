import { NextRequest, NextResponse } from 'next/server'
import { ok, apiError, requireAdmin } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { payout, supplier } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const rows = await db
      .select()
      .from(payout)
      .orderBy(desc(payout.createdAt))
      .limit(200)

    const supRows = await db.select({ id: supplier.id, name: supplier.name, nameAr: supplier.nameAr }).from(supplier)
    const supMap  = Object.fromEntries(supRows.map((s) => [s.id, s.nameAr ?? s.name]))

    const data = rows.map((p) => ({
      id:          p.id,
      supplier:    supMap[p.supplierId] ?? p.supplierId,
      supplierId:  p.supplierId,
      amount:      Number(p.amount),
      currency:    p.currency,
      status:      p.status,
      reference:   p.reference ?? '',
      bankAccount: p.bankAccount as Record<string, string> | null,
      processedAt: p.processedAt?.toISOString() ?? null,
      createdAt:   p.createdAt.toISOString(),
    }))

    return ok(data)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
