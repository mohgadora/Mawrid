/**
 * services/coupon.ts — Coupon Engine data layer.
 *
 * محرّك كوبونات كامل: تحقّق من الأهلية (تاريخ، حدود الاستخدام، النطاق، الحد
 * الأدنى)، حساب الخصم بأمان عبر السنتات، وتسجيل الاستخدام. يُستدعى من الدفع
 * (المشتري) ومن لوحة الأدمن/المورد لإدارة الكوبونات.
 *
 * كل المبالغ بالدولار (USD) وتُحسب داخلياً بالسنتات عبر lib/money.ts — لا حساب
 * عائم مباشر على العملة.
 */
import 'server-only'
import { db } from '@/lib/db'
import { coupon, couponUsage, order, product, supplier } from '@/lib/db/schema'
import { eq, and, sql, desc, inArray, count } from 'drizzle-orm'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { couponDiscountUsd } from '@/lib/discounts'

type DbCoupon = typeof coupon.$inferSelect

/** يوحّد أسماء الأنواع القديمة ('percentage') مع الجديدة ('percent'). */
function normalizeType(type: string): 'percent' | 'fixed' | 'free_shipping' {
  if (type === 'percentage' || type === 'percent') return 'percent'
  if (type === 'free_shipping') return 'free_shipping'
  return 'fixed'
}

export type ValidateCouponInput = {
  subtotalUsd: number
  shippingUsd?: number
  productIds?: string[]
}

export type ValidateCouponResult = {
  valid: boolean
  message: string
  coupon?: DbCoupon
  /** الخصم على المجموع الفرعي بالدولار. */
  discountUsd: number
  /** true إذا كان الكوبون شحناً مجانياً. */
  freeShipping: boolean
}

function invalid(message: string): ValidateCouponResult {
  return { valid: false, message, discountUsd: 0, freeShipping: false }
}

/**
 * يحسب قيمة الخصم بالدولار من كوبون ومجموع فرعي — بأمان عبر السنتات.
 * الشحن المجاني يُرجع خصماً صفرياً مع freeShipping=true (يطبّقه الطالب على الشحن).
 */
function computeDiscount(
  c: DbCoupon,
  subtotalUsd: number,
): { discountUsd: number; freeShipping: boolean } {
  return couponDiscountUsd(
    normalizeType(c.type),
    Number(c.value),
    subtotalUsd,
    c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null,
  )
}

/** يتحقق أن أصناف السلة تستوفي نطاق الكوبون (supplier/category/product). */
async function checkScope(c: DbCoupon, productIds: string[]): Promise<boolean> {
  const scope = c.scope ?? 'global'
  if (scope === 'global' || scope === 'first_order') return true
  if (!productIds.length) return false

  const rows = await db
    .select({ id: product.id, supplierId: product.supplierId, categoryId: product.categoryId })
    .from(product)
    .where(inArray(product.id, productIds))

  const scopeIds = new Set(((c.scopeIds as string[] | null) ?? []).map(String))
  // توافق مع الحقول القديمة
  const productScope = new Set([...(((c.applicableProductIds as string[] | null) ?? []).map(String))])
  const categoryScope = new Set([...(((c.applicableCategoryIds as string[] | null) ?? []).map(String))])

  if (scope === 'supplier') {
    return rows.some((r) => r.supplierId && scopeIds.has(r.supplierId))
  }
  if (scope === 'category') {
    return rows.some((r) => r.categoryId && (scopeIds.has(r.categoryId) || categoryScope.has(r.categoryId)))
  }
  if (scope === 'product') {
    return rows.some((r) => scopeIds.has(r.id) || productScope.has(r.id))
  }
  return true
}

/** هل هذا أول طلب للمستخدم؟ (لكوبونات first_order) */
async function isFirstOrder(userId: string): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(order).where(eq(order.userId, userId))
  return (row?.n ?? 0) === 0
}

/**
 * يتحقق من كامل أهلية الكوبون ويُرجع الخصم المحسوب.
 * لا يعدّل أي شيء — القراءة فقط. الطالب هو من يستدعي applyCoupon عند الإنشاء.
 */
export async function validateCoupon(
  code: string,
  userId: string,
  input: ValidateCouponInput,
): Promise<ValidateCouponResult> {
  const normalized = String(code ?? '').toUpperCase().trim()
  if (!normalized) return invalid('أدخل كود الكوبون')

  const [c] = await db.select().from(coupon).where(eq(coupon.code, normalized)).limit(1)
  if (!c) return invalid('كود الكوبون غير صحيح')
  if (!c.active) return invalid('هذا الكوبون غير مفعّل')

  const now = Date.now()
  if (c.startsAt && c.startsAt.getTime() > now) return invalid('لم يبدأ هذا الكوبون بعد')
  if (c.expiresAt && c.expiresAt.getTime() < now) return invalid('انتهت صلاحية هذا الكوبون')

  // الحد الأقصى للاستخدامات الكلية
  if (c.usageLimitTotal != null && c.usedCount >= c.usageLimitTotal) {
    return invalid('انتهى الحد الأقصى لاستخدام هذا الكوبون')
  }

  // الحد الأقصى لكل مستخدم
  const perUser = c.usageLimitPerCustomer ?? 1
  if (perUser > 0) {
    const [used] = await db
      .select({ n: count() })
      .from(couponUsage)
      .where(and(eq(couponUsage.couponId, c.id), eq(couponUsage.userId, userId)))
    if ((used?.n ?? 0) >= perUser) return invalid('لقد استخدمت هذا الكوبون من قبل')
  }

  // الحد الأدنى للطلب
  const minOrder = c.minOrderAmount != null ? Number(c.minOrderAmount) : 0
  if (minOrder > 0 && input.subtotalUsd < minOrder) {
    return invalid(`الحد الأدنى للطلب هو ${minOrder.toFixed(2)}$`)
  }

  // كوبون أول طلب
  if (c.scope === 'first_order' || c.firstOrderOnly) {
    if (!(await isFirstOrder(userId))) return invalid('هذا الكوبون لأول طلب فقط')
  }

  // النطاق
  if (!(await checkScope(c, input.productIds ?? []))) {
    return invalid('هذا الكوبون لا ينطبق على منتجات سلتك')
  }

  const { discountUsd, freeShipping } = computeDiscount(c, input.subtotalUsd)
  if (!freeShipping && discountUsd <= 0) return invalid('لا ينطبق خصم على هذا الطلب')

  return {
    valid: true,
    message: 'تم تطبيق الكوبون',
    coupon: c,
    discountUsd,
    freeShipping,
  }
}

/**
 * يسجّل استخدام الكوبون: يزيد usedCount ويُدخل سطر coupon_usage.
 * يجب استدعاؤه داخل معاملة الطلب (مرّر tx) لضمان الذرّية.
 */
export async function applyCoupon(
  tx: Pick<typeof db, 'insert' | 'update'>,
  params: { couponId: string; userId: string; orderId: string; discountUsd: number },
): Promise<void> {
  await tx
    .update(coupon)
    .set({ usedCount: sql`${coupon.usedCount} + 1` })
    .where(eq(coupon.id, params.couponId))

  await tx.insert(couponUsage).values({
    id: crypto.randomUUID(),
    couponId: params.couponId,
    userId: params.userId,
    orderId: params.orderId,
    discountAmount: params.discountUsd.toFixed(2),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// عرض للمشتري
// ═══════════════════════════════════════════════════════════════════════════

/** الكوبونات العامة الفعّالة والصالحة زمنياً — لعرضها كبطاقات للمشتري. */
export async function getAvailableCoupons(): Promise<DbCoupon[]> {
  const now = new Date()
  const rows = await db
    .select()
    .from(coupon)
    .where(eq(coupon.active, true))
    .orderBy(desc(coupon.createdAt))
    .limit(100)

  return rows.filter((c) => {
    if (c.startsAt && c.startsAt.getTime() > now.getTime()) return false
    if (c.expiresAt && c.expiresAt.getTime() < now.getTime()) return false
    if (c.usageLimitTotal != null && c.usedCount >= c.usageLimitTotal) return false
    // نعرض فقط الكوبونات العامة وأول طلب (النطاقات الخاصة تُطبّق تلقائياً)
    return c.scope === 'global' || c.scope === 'first_order' || !c.scope
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// بوابة المورد — كوبونات مرتبطة بمتجر واحد
// ═══════════════════════════════════════════════════════════════════════════

/** يحلّ supplierId من userId (أو من الانتحال للأدمن). */
async function resolveSupplierId(userId: string, impersonatedSupplierId?: string): Promise<string> {
  if (impersonatedSupplierId) return impersonatedSupplierId
  const [row] = await db.select({ id: supplier.id }).from(supplier).where(eq(supplier.userId, userId)).limit(1)
  if (!row) throw new ForbiddenError('لا يوجد متجر مرتبط بهذا الحساب')
  return row.id
}

export async function supplierListCoupons(userId: string, impersonatedSupplierId?: string): Promise<DbCoupon[]> {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  return db
    .select()
    .from(coupon)
    .where(eq(coupon.supplierId, supplierId))
    .orderBy(desc(coupon.createdAt))
    .limit(200)
}

export type SupplierCouponInput = {
  code: string
  type: string
  value: number
  minOrderAmount?: number | null
  maxDiscountAmount?: number | null
  usageLimitTotal?: number | null
  usageLimitPerCustomer?: number
  startsAt?: string | null
  expiresAt?: string | null
  active?: boolean
  titleAr?: string | null
  titleEn?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
}

function validateCouponInput(data: SupplierCouponInput) {
  const code = String(data.code ?? '').toUpperCase().trim()
  if (!code || code.length < 3) throw new ValidationError('كود الكوبون يجب أن يكون 3 أحرف على الأقل')
  const type = normalizeType(String(data.type ?? ''))
  const value = Number(data.value)
  if (!Number.isFinite(value) || value <= 0) throw new ValidationError('قيمة الخصم يجب أن تكون أكبر من صفر')
  if (type === 'percent' && value > 100) throw new ValidationError('نسبة الخصم يجب أن تكون 100% أو أقل')
  if (data.startsAt && data.expiresAt && new Date(data.startsAt) >= new Date(data.expiresAt)) {
    throw new ValidationError('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء')
  }
  return { code, type }
}

export async function supplierCreateCoupon(
  userId: string,
  data: SupplierCouponInput,
  impersonatedSupplierId?: string,
): Promise<DbCoupon> {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  const { code, type } = validateCouponInput(data)

  const [existing] = await db.select({ id: coupon.id }).from(coupon).where(eq(coupon.code, code)).limit(1)
  if (existing) throw new ValidationError('هذا الكود مستخدم بالفعل')

  const [row] = await db
    .insert(coupon)
    .values({
      id: crypto.randomUUID(),
      code,
      type,
      value: String(data.value),
      minOrderAmount: data.minOrderAmount != null ? String(data.minOrderAmount) : null,
      maxDiscountAmount: data.maxDiscountAmount != null ? String(data.maxDiscountAmount) : null,
      usageLimitTotal: data.usageLimitTotal ?? null,
      usageLimitPerCustomer: data.usageLimitPerCustomer ?? 1,
      scope: 'supplier',
      scopeIds: [supplierId],
      supplierId,
      titleAr: data.titleAr ?? null,
      titleEn: data.titleEn ?? null,
      descriptionAr: data.descriptionAr ?? null,
      descriptionEn: data.descriptionEn ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      active: data.active ?? true,
      createdBy: supplierId,
    })
    .returning()

  await writeAuditLog({ userId, action: 'coupon.create', entity: 'coupon', entityId: row.id, meta: { supplierId } })
  return row
}

export async function supplierDeleteCoupon(
  userId: string,
  couponId: string,
  impersonatedSupplierId?: string,
): Promise<void> {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  const [row] = await db.select().from(coupon).where(eq(coupon.id, couponId)).limit(1)
  if (!row) throw new NotFoundError('الكوبون غير موجود')
  if (row.supplierId !== supplierId) throw new ForbiddenError('لا تملك صلاحية حذف هذا الكوبون')
  await db.delete(coupon).where(eq(coupon.id, couponId))
  await writeAuditLog({ userId, action: 'coupon.delete', entity: 'coupon', entityId: couponId, meta: { supplierId } })
}
