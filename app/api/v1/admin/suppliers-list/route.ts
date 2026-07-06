import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, ok, serverError } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { supplier } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const rows = await db
      .select({ id: supplier.id, name: supplier.nameAr, nameEn: supplier.name, status: supplier.status })
      .from(supplier)
      .orderBy(asc(supplier.nameAr))
    return ok(rows.map((r) => ({ id: r.id, name: r.name ?? r.nameEn ?? r.id, status: r.status })))
  } catch (err) { return serverError(err) }
}
