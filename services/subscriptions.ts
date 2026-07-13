/**
 * services/subscriptions.ts — Store subscription plans + supplier subscriptions.
 */
import 'server-only'
import { db } from '@/lib/db'
import { subscriptionPlan, storeSubscription, supplier } from '@/lib/db/schema'
import { eq, and, asc, desc, inArray } from 'drizzle-orm'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

type DbPlan = typeof subscriptionPlan.$inferSelect
type DbSub = typeof storeSubscription.$inferSelect

/** الباقات المتاحة للعرض (المفعّلة فقط، مرتّبة). */
export async function listActivePlans(): Promise<DbPlan[]> {
  return db.select().from(subscriptionPlan).where(eq(subscriptionPlan.active, true)).orderBy(asc(subscriptionPlan.sortOrder))
}

export async function listAllPlans(): Promise<DbPlan[]> {
  return db.select().from(subscriptionPlan).orderBy(asc(subscriptionPlan.sortOrder))
}

// ── Admin plan CRUD ──────────────────────────────────────────────────────────

export type PlanInput = {
  nameAr: string
  nameEn?: string | null
  priceMonthly: number
  priceYearly?: number | null
  maxProducts?: number | null
  maxOrders?: number | null
  commissionRate?: number | null
  features?: string[]
  active?: boolean
  sortOrder?: number
}

function validatePlan(data: PlanInput) {
  if (!data.nameAr?.trim()) throw new ValidationError('اسم الباقة بالعربية مطلوب')
  if (!Number.isFinite(data.priceMonthly) || data.priceMonthly < 0) throw new ValidationError('السعر الشهري غير صالح')
}

export async function createPlan(data: PlanInput, adminId: string): Promise<DbPlan> {
  validatePlan(data)
  const [row] = await db
    .insert(subscriptionPlan)
    .values({
      id: crypto.randomUUID(),
      nameAr: data.nameAr.trim(),
      nameEn: data.nameEn ?? null,
      priceMonthly: String(data.priceMonthly),
      priceYearly: data.priceYearly != null ? String(data.priceYearly) : null,
      maxProducts: data.maxProducts ?? null,
      maxOrders: data.maxOrders ?? null,
      commissionRate: data.commissionRate != null ? String(data.commissionRate) : null,
      features: Array.isArray(data.features) ? data.features.map(String) : [],
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'plan.create', entity: 'subscription_plan', entityId: row.id })
  return row
}

export async function updatePlan(id: string, data: Partial<PlanInput>, adminId: string): Promise<DbPlan> {
  const set: Record<string, unknown> = {}
  if (data.nameAr !== undefined) set.nameAr = data.nameAr
  if (data.nameEn !== undefined) set.nameEn = data.nameEn
  if (data.priceMonthly !== undefined) set.priceMonthly = String(data.priceMonthly)
  if ('priceYearly' in data) set.priceYearly = data.priceYearly != null ? String(data.priceYearly) : null
  if ('maxProducts' in data) set.maxProducts = data.maxProducts ?? null
  if ('maxOrders' in data) set.maxOrders = data.maxOrders ?? null
  if ('commissionRate' in data) set.commissionRate = data.commissionRate != null ? String(data.commissionRate) : null
  if (data.features !== undefined) set.features = data.features
  if (data.active !== undefined) set.active = data.active
  if (data.sortOrder !== undefined) set.sortOrder = data.sortOrder
  const [row] = await db.update(subscriptionPlan).set(set).where(eq(subscriptionPlan.id, id)).returning()
  if (!row) throw new NotFoundError('الباقة غير موجودة')
  await writeAuditLog({ userId: adminId, action: 'plan.update', entity: 'subscription_plan', entityId: id })
  return row
}

export async function deletePlan(id: string, adminId: string): Promise<void> {
  await db.delete(subscriptionPlan).where(eq(subscriptionPlan.id, id))
  await writeAuditLog({ userId: adminId, action: 'plan.delete', entity: 'subscription_plan', entityId: id })
}

// ── Supplier subscription ─────────────────────────────────────────────────────

async function resolveSupplierId(userId: string, impersonatedSupplierId?: string): Promise<string> {
  if (impersonatedSupplierId) return impersonatedSupplierId
  const [row] = await db.select({ id: supplier.id }).from(supplier).where(eq(supplier.userId, userId)).limit(1)
  if (!row) throw new ForbiddenError('لا يوجد متجر مرتبط بهذا الحساب')
  return row.id
}

/** الاشتراك الحالي للمورد مع بيانات الباقة (أو null). */
export async function getSupplierSubscription(userId: string, impersonatedSupplierId?: string) {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  const [sub] = await db
    .select()
    .from(storeSubscription)
    .where(and(eq(storeSubscription.supplierId, supplierId), eq(storeSubscription.status, 'active')))
    .orderBy(desc(storeSubscription.createdAt))
    .limit(1)
  if (!sub) return { subscription: null, plan: null }
  const [plan] = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.id, sub.planId)).limit(1)
  return { subscription: sub, plan: plan ?? null }
}

/** يشترك المورد في باقة (يستبدل الاشتراك الفعّال الحالي). */
export async function subscribeSupplier(
  userId: string,
  planId: string,
  cycle: 'monthly' | 'yearly',
  impersonatedSupplierId?: string,
): Promise<DbSub> {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  const [plan] = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.id, planId)).limit(1)
  if (!plan || !plan.active) throw new ValidationError('الباقة غير متاحة')

  const now = new Date()
  const end = new Date(now)
  if (cycle === 'yearly') end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)

  const sub = await db.transaction(async (tx) => {
    // ألغِ أي اشتراك فعّال قائم
    await tx
      .update(storeSubscription)
      .set({ status: 'cancelled', updatedAt: now })
      .where(and(eq(storeSubscription.supplierId, supplierId), eq(storeSubscription.status, 'active')))

    const [row] = await tx
      .insert(storeSubscription)
      .values({
        id: crypto.randomUUID(),
        supplierId,
        planId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: end,
        autoRenew: true,
      })
      .returning()
    return row
  })

  await writeAuditLog({ userId, action: 'subscription.subscribe', entity: 'store_subscription', entityId: sub.id, meta: { planId, cycle } })
  return sub
}

export async function cancelSupplierSubscription(userId: string, impersonatedSupplierId?: string): Promise<void> {
  const supplierId = await resolveSupplierId(userId, impersonatedSupplierId)
  await db
    .update(storeSubscription)
    .set({ status: 'cancelled', autoRenew: false, updatedAt: new Date() })
    .where(and(eq(storeSubscription.supplierId, supplierId), eq(storeSubscription.status, 'active')))
  await writeAuditLog({ userId, action: 'subscription.cancel', entity: 'store_subscription', entityId: supplierId })
}

// ── Admin: all store subscriptions ────────────────────────────────────────────

export async function adminListSubscriptions() {
  const subs = await db.select().from(storeSubscription).orderBy(desc(storeSubscription.createdAt)).limit(300)
  if (!subs.length) return []
  const planIds = [...new Set(subs.map((s) => s.planId))]
  const supplierIds = [...new Set(subs.map((s) => s.supplierId))]
  const [plans, sups] = await Promise.all([
    db.select({ id: subscriptionPlan.id, nameAr: subscriptionPlan.nameAr }).from(subscriptionPlan).where(inArray(subscriptionPlan.id, planIds)),
    db.select({ id: supplier.id, name: supplier.name }).from(supplier).where(inArray(supplier.id, supplierIds)),
  ])
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.nameAr]))
  const supMap = Object.fromEntries(sups.map((s) => [s.id, s.name]))
  return subs.map((s) => ({
    ...s,
    planName: planMap[s.planId] ?? s.planId,
    supplierName: supMap[s.supplierId] ?? s.supplierId,
  }))
}
