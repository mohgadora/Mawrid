/**
 * services/ads.ts — In-App Advertisements data layer.
 * عرض حسب الموضع + تتبّع الظهور/النقر + إدارة الأدمن + إنشاء المورد (بموافقة).
 */
import 'server-only'
import { db } from '@/lib/db'
import { advertisement, supplier } from '@/lib/db/schema'
import { eq, and, desc, sql, lte, gte, or, isNull } from 'drizzle-orm'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

type DbAd = typeof advertisement.$inferSelect

const PLACEMENTS = ['home_top', 'home_middle', 'category_page', 'search_results', 'checkout'] as const
const TYPES = ['banner', 'popup', 'product_highlight', 'category_highlight'] as const

/** الإعلانات المعتمدة والفعّالة والصالحة زمنياً لموضع معيّن. */
export async function getAdsByPlacement(placement: string): Promise<DbAd[]> {
  const now = new Date()
  return db
    .select()
    .from(advertisement)
    .where(and(
      eq(advertisement.placement, placement),
      eq(advertisement.active, true),
      eq(advertisement.status, 'approved'),
      or(isNull(advertisement.startsAt), lte(advertisement.startsAt, now)),
      or(isNull(advertisement.expiresAt), gte(advertisement.expiresAt, now)),
    ))
    .orderBy(desc(advertisement.priority), desc(advertisement.createdAt))
    .limit(10)
}

export async function trackImpression(id: string): Promise<void> {
  await db.update(advertisement).set({ impressions: sql`${advertisement.impressions} + 1` }).where(eq(advertisement.id, id))
}

export async function trackClick(id: string): Promise<void> {
  await db.update(advertisement).set({ clicks: sql`${advertisement.clicks} + 1` }).where(eq(advertisement.id, id))
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function listAds(): Promise<DbAd[]> {
  return db.select().from(advertisement).orderBy(desc(advertisement.createdAt)).limit(300)
}

export type AdInput = {
  titleAr: string
  titleEn?: string | null
  type: string
  imageUrl: string
  targetUrl?: string | null
  placement: string
  priority?: number
  active?: boolean
  startsAt?: string | null
  expiresAt?: string | null
}

function validateAd(data: AdInput) {
  if (!data.titleAr?.trim()) throw new ValidationError('العنوان بالعربية مطلوب')
  if (!data.imageUrl?.trim()) throw new ValidationError('صورة الإعلان مطلوبة')
  if (!(TYPES as readonly string[]).includes(data.type)) throw new ValidationError('نوع إعلان غير صالح')
  if (!(PLACEMENTS as readonly string[]).includes(data.placement)) throw new ValidationError('موضع إعلان غير صالح')
}

export async function createAd(data: AdInput, adminId: string): Promise<DbAd> {
  validateAd(data)
  const [row] = await db
    .insert(advertisement)
    .values({
      id: crypto.randomUUID(),
      titleAr: data.titleAr.trim(),
      titleEn: data.titleEn ?? null,
      type: data.type,
      imageUrl: data.imageUrl.trim(),
      targetUrl: data.targetUrl ?? null,
      placement: data.placement,
      priority: data.priority ?? 0,
      status: 'approved',
      active: data.active ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'ad.create', entity: 'advertisement', entityId: row.id })
  return row
}

export async function updateAd(id: string, data: Partial<AdInput> & { status?: string }, adminId: string): Promise<DbAd> {
  const set: Record<string, unknown> = {}
  if (data.titleAr !== undefined) set.titleAr = data.titleAr
  if (data.titleEn !== undefined) set.titleEn = data.titleEn
  if (data.type !== undefined) set.type = data.type
  if (data.imageUrl !== undefined) set.imageUrl = data.imageUrl
  if (data.targetUrl !== undefined) set.targetUrl = data.targetUrl
  if (data.placement !== undefined) set.placement = data.placement
  if (data.priority !== undefined) set.priority = data.priority
  if (data.active !== undefined) set.active = data.active
  if (data.status !== undefined) set.status = data.status
  if ('startsAt' in data) set.startsAt = data.startsAt ? new Date(data.startsAt) : null
  if ('expiresAt' in data) set.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  const [row] = await db.update(advertisement).set(set).where(eq(advertisement.id, id)).returning()
  if (!row) throw new NotFoundError('الإعلان غير موجود')
  await writeAuditLog({ userId: adminId, action: 'ad.update', entity: 'advertisement', entityId: id })
  return row
}

export async function deleteAd(id: string, adminId: string): Promise<void> {
  await db.delete(advertisement).where(eq(advertisement.id, id))
  await writeAuditLog({ userId: adminId, action: 'ad.delete', entity: 'advertisement', entityId: id })
}

// ── Supplier (pending approval) ──────────────────────────────────────────────

export async function supplierCreateAd(
  userId: string,
  data: AdInput,
  impersonatedSupplierId?: string,
): Promise<DbAd> {
  validateAd(data)
  let supplierId = impersonatedSupplierId
  if (!supplierId) {
    const [sup] = await db.select({ id: supplier.id }).from(supplier).where(eq(supplier.userId, userId)).limit(1)
    if (!sup) throw new ForbiddenError('لا يوجد متجر مرتبط بهذا الحساب')
    supplierId = sup.id
  }
  const [row] = await db
    .insert(advertisement)
    .values({
      id: crypto.randomUUID(),
      titleAr: data.titleAr.trim(),
      titleEn: data.titleEn ?? null,
      type: data.type,
      imageUrl: data.imageUrl.trim(),
      targetUrl: data.targetUrl ?? null,
      placement: data.placement,
      priority: 0,
      supplierId,
      status: 'pending', // تخضع لموافقة الأدمن
      active: true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning()
  await writeAuditLog({ userId, action: 'ad.supplier_create', entity: 'advertisement', entityId: row.id, meta: { supplierId } })
  return row
}
