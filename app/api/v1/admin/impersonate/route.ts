import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, apiError, ok } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { supplier } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'
import {
  IMPERSONATION_COOKIE,
  createImpersonationToken,
  impersonationCookieOptions,
  readImpersonation,
} from '@/lib/impersonation'

/** حالة الانتحال الحالية (للبانر). */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  const imp = await readImpersonation()
  if (!imp) return ok({ active: false })
  const [row] = await db
    .select({ id: supplier.id, name: supplier.nameAr, nameEn: supplier.name })
    .from(supplier)
    .where(eq(supplier.id, imp.supplierId))
    .limit(1)
  return ok({ active: true, supplierId: imp.supplierId, supplierName: row?.name ?? row?.nameEn ?? imp.supplierId })
}

/** بدء "الدخول كمتجر" — أدمن فقط. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  try {
    const body = (await req.json().catch(() => null)) as { supplierId?: string } | null
    const supplierId = String(body?.supplierId ?? '').trim()
    if (!supplierId) return apiError(new Error('supplierId required'))

    const [row] = await db.select({ id: supplier.id }).from(supplier).where(eq(supplier.id, supplierId)).limit(1)
    if (!row) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

    const token = createImpersonationToken(guard.id, supplierId)
    await writeAuditLog({
      userId: guard.id,
      action: 'impersonate.start',
      entity: 'supplier',
      entityId: supplierId,
      ip: req.headers.get('x-real-ip'),
    })
    const res = ok({ active: true, supplierId })
    res.cookies.set(IMPERSONATION_COOKIE, token, impersonationCookieOptions(30 * 60))
    return res
  } catch (err) {
    return apiError(err)
  }
}

/** إنهاء الانتحال. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  const imp = await readImpersonation()
  if (imp) {
    await writeAuditLog({
      userId: guard.id,
      action: 'impersonate.stop',
      entity: 'supplier',
      entityId: imp.supplierId,
      ip: req.headers.get('x-real-ip'),
    })
  }
  const res = ok({ active: false })
  res.cookies.set(IMPERSONATION_COOKIE, '', impersonationCookieOptions(0))
  return res
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
