/**
 * services/account.ts — Account data layer backed 100% by Neon/Drizzle.
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  user,
  address as addressTable,
  favorite as favoriteTable,
  orderTemplate as templateTable,
  product as productTable,
  priceTier,
  kycApproval,
} from '@/lib/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { resolveActor, type Actor } from '@/lib/actor'
import { ValidationError, NotFoundError } from '@/lib/errors'

export type { Address, Branch, Profile, ReorderTemplate } from '@/lib/account-types'
import type { Address, Branch, Profile, ReorderTemplate } from '@/lib/account-types'

export type AccountProduct = {
  id: string
  nameAr: string
  nameEn: string
  image: string
  supplierId: string
  categorySlug: string
  unitsPerCarton: number
  moq: number
  basePrice: number
  tiers: { minQty: number; pricePerCarton: number }[]
}

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)

function validatePhone(phone: string) {
  if (phone && !/^\+?[0-9]{7,20}$/.test(phone)) {
    throw new ValidationError('رقم هاتف غير صالح')
  }
}

export async function getProfile(actor?: Actor): Promise<Profile> {
  const userId = (await resolveActor(actor)).id
  const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (!rows.length) {
    return { name: '', email: '', phone: '', company: '', country: 'SA', vatNumber: '', role: 'consumer' }
  }
  const u = rows[0]
  return {
    name: u.name,
    email: u.email,
    phone: u.phone ?? '',
    company: u.company ?? '',
    country: u.country ?? 'SA',
    vatNumber: u.vatNumber ?? '',
    role: u.role ?? 'consumer',
  }
}

export async function updateProfile(data: Partial<Profile>, actor?: Actor): Promise<Profile> {
  const userId = (await resolveActor(actor)).id
  if (data.name !== undefined) {
    const name = clip(data.name, 120)
    if (!name) throw new ValidationError('الاسم مطلوب')
  }
  if (data.phone !== undefined) validatePhone(clip(data.phone, 20))
  await db
    .update(user)
    .set({
      ...(data.name !== undefined ? { name: clip(data.name, 120) } : {}),
      ...(data.phone !== undefined ? { phone: clip(data.phone, 20) } : {}),
      ...(data.company !== undefined ? { company: clip(data.company, 120) } : {}),
      ...(data.country !== undefined ? { country: clip(data.country, 4) } : {}),
      ...(data.vatNumber !== undefined ? { vatNumber: clip(data.vatNumber, 30) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
  return getProfile(actor)
}

export async function setBuyerType(
  data: { role: 'consumer' | 'merchant'; company?: string },
  actor?: Actor,
): Promise<Profile> {
  const userId = (await resolveActor(actor)).id
  const role = data.role === 'merchant' ? 'merchant' : 'consumer'
  const company = data.company ? clip(data.company, 120) : undefined

  if (role === 'merchant' && !company) {
    throw new ValidationError('اسم المنشأة مطلوب للتجار')
  }

  await db
    .update(user)
    .set({
      role,
      ...(company ? { company } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))

  return getProfile(actor)
}

export async function getAddresses(actor?: Actor): Promise<Address[]> {
  const userId = (await resolveActor(actor)).id
  const rows = await db
    .select()
    .from(addressTable)
    .where(eq(addressTable.userId, userId))
    .orderBy(desc(addressTable.isDefault))
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    line1: r.line1,
    city: r.city,
    country: r.country,
    isDefault: r.isDefault,
    fullName: r.fullName,
    phone: r.phone,
  }))
}

export async function addAddress(addr: Omit<Address, 'id'>, actor?: Actor): Promise<Address> {
  const userId = (await resolveActor(actor)).id
  const label = clip(addr.label, 60)
  const line1 = clip(addr.line1, 200)
  const city = clip(addr.city, 80)
  if (!line1 || !city) throw new ValidationError('العنوان والمدينة مطلوبان')
  validatePhone(clip(addr.phone, 20))

  return db.transaction(async (tx) => {
    if (addr.isDefault) {
      await tx
        .update(addressTable)
        .set({ isDefault: false })
        .where(eq(addressTable.userId, userId))
    }
    const [row] = await tx
      .insert(addressTable)
      .values({
        id: crypto.randomUUID(),
        userId,
        label: label || 'Home',
        fullName: clip(addr.fullName, 120),
        phone: clip(addr.phone, 20),
        line1,
        city,
        country: clip(addr.country, 4) || 'SA',
        isDefault: Boolean(addr.isDefault),
        createdAt: new Date(),
      })
      .returning()
    return {
      id: row.id,
      label: row.label,
      line1: row.line1,
      city: row.city,
      country: row.country,
      isDefault: row.isDefault,
      fullName: row.fullName,
      phone: row.phone,
    }
  })
}

export async function updateAddress(
  id: string,
  data: Partial<Omit<Address, 'id'>>,
  actor?: Actor,
): Promise<Address> {
  const userId = (await resolveActor(actor)).id
  if (data.phone !== undefined) validatePhone(clip(data.phone, 20))
  if (data.line1 !== undefined && !clip(data.line1, 200)) {
    throw new ValidationError('العنوان مطلوب')
  }
  if (data.city !== undefined && !clip(data.city, 80)) {
    throw new ValidationError('المدينة مطلوبة')
  }

  return db.transaction(async (tx) => {
    if (data.isDefault) {
      await tx
        .update(addressTable)
        .set({ isDefault: false })
        .where(eq(addressTable.userId, userId))
    }

    const [row] = await tx
      .update(addressTable)
      .set({
        ...(data.label !== undefined ? { label: clip(data.label, 60) || 'Home' } : {}),
        ...(data.fullName !== undefined ? { fullName: clip(data.fullName, 120) } : {}),
        ...(data.phone !== undefined ? { phone: clip(data.phone, 20) } : {}),
        ...(data.line1 !== undefined ? { line1: clip(data.line1, 200) } : {}),
        ...(data.city !== undefined ? { city: clip(data.city, 80) } : {}),
        ...(data.country !== undefined ? { country: clip(data.country, 4) || 'SA' } : {}),
        ...(data.isDefault !== undefined ? { isDefault: Boolean(data.isDefault) } : {}),
      })
      .where(and(eq(addressTable.id, id), eq(addressTable.userId, userId)))
      .returning()

    if (!row) throw new NotFoundError('العنوان غير موجود')

    return {
      id: row.id,
      label: row.label,
      line1: row.line1,
      city: row.city,
      country: row.country,
      isDefault: row.isDefault,
      fullName: row.fullName,
      phone: row.phone,
    }
  })
}

export async function removeAddress(id: string, actor?: Actor): Promise<void> {
  const userId = (await resolveActor(actor)).id
  const deleted = await db
    .delete(addressTable)
    .where(and(eq(addressTable.id, id), eq(addressTable.userId, userId)))
    .returning({ id: addressTable.id })
  if (!deleted.length) throw new NotFoundError('العنوان غير موجود')
}

export async function getBranches(): Promise<Branch[]> {
  return []
}

export async function getFavorites(actor?: Actor): Promise<AccountProduct[]> {
  const userId = (await resolveActor(actor)).id
  const favRows = await db
    .select()
    .from(favoriteTable)
    .where(eq(favoriteTable.userId, userId))

  if (!favRows.length) return []

  const productIds = favRows.map((r) => r.productId)
  const [products, tiers] = await Promise.all([
    db.select().from(productTable).where(inArray(productTable.id, productIds)),
    db.select().from(priceTier).where(inArray(priceTier.productId, productIds)),
  ])

  const tiersByProduct = new Map<string, { minQty: number; pricePerCarton: number }[]>()
  for (const t of tiers) {
    const arr = tiersByProduct.get(t.productId) ?? []
    arr.push({ minQty: t.minQty, pricePerCarton: Number(t.price) })
    tiersByProduct.set(t.productId, arr)
  }

  return products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr ?? p.name,
    nameEn: p.name,
    image: p.imageUrl ?? '/placeholder.png',
    supplierId: p.supplierId ?? '',
    categorySlug: p.categoryId ?? '',
    unitsPerCarton: p.unitsPerCarton,
    moq: tiersByProduct.get(p.id)?.[0]?.minQty ?? 1,
    basePrice: Number(tiersByProduct.get(p.id)?.[0]?.pricePerCarton ?? p.marketAvgPrice ?? 0),
    tiers: tiersByProduct.get(p.id) ?? [],
  }))
}

export async function getMerchantKycStatus(actor?: Actor) {
  const userId = (await resolveActor(actor)).id
  const [row] = await db
    .select()
    .from(kycApproval)
    .where(eq(kycApproval.userId, userId))
    .orderBy(desc(kycApproval.submittedAt))
    .limit(1)
  return {
    status: row?.status ?? 'none',
    crNumber: row?.crNumber ?? '',
    vatNumber: row?.vatNumber ?? '',
  }
}

export async function submitMerchantKyc(
  data: { company: string; crNumber?: string; vatNumber?: string },
  actor?: Actor,
) {
  const userId = (await resolveActor(actor)).id
  const company = clip(data.company, 120)
  if (!company) throw new ValidationError('اسم المنشأة مطلوب')

  await db
    .update(user)
    .set({ company, vatNumber: data.vatNumber ? clip(data.vatNumber, 30) : undefined, updatedAt: new Date() })
    .where(eq(user.id, userId))

  const [row] = await db
    .insert(kycApproval)
    .values({
      id: crypto.randomUUID(),
      userId,
      type: 'merchant',
      status: 'pending',
      crNumber: data.crNumber ? clip(data.crNumber, 30) : null,
      vatNumber: data.vatNumber ? clip(data.vatNumber, 30) : null,
      documents: [],
      submittedAt: new Date(),
    })
    .returning()

  return row
}

export async function toggleFavorite(productId: string, actor?: Actor): Promise<boolean> {
  const userId = (await resolveActor(actor)).id
  const pid = clip(productId, 80)
  if (!pid) throw new ValidationError('معرّف المنتج غير صالح')

  const [productRow] = await db
    .select({ id: productTable.id, active: productTable.active })
    .from(productTable)
    .where(eq(productTable.id, pid))
    .limit(1)
  if (!productRow?.active) throw new ValidationError('المنتج غير متاح')

  const existing = await db
    .select()
    .from(favoriteTable)
    .where(and(eq(favoriteTable.userId, userId), eq(favoriteTable.productId, pid)))
    .limit(1)

  if (existing.length) {
    await db
      .delete(favoriteTable)
      .where(and(eq(favoriteTable.userId, userId), eq(favoriteTable.productId, pid)))
    return false
  }

  await db.insert(favoriteTable).values({
    id: crypto.randomUUID(),
    userId,
    productId: pid,
    createdAt: new Date(),
  })
  return true
}

export async function getReorderTemplates(actor?: Actor): Promise<ReorderTemplate[]> {
  const userId = (await resolveActor(actor)).id
  const rows = await db
    .select()
    .from(templateTable)
    .where(eq(templateTable.userId, userId))
    .orderBy(desc(templateTable.createdAt))

  if (!rows.length) return []

  type TemplateItem = { productId: string; qty: number }
  const allProductIds = Array.from(
    new Set(rows.flatMap((r) => ((r.items as TemplateItem[]) ?? []).map((i) => i.productId))),
  )

  const products = allProductIds.length
    ? await db
        .select({
          id: productTable.id,
          name: productTable.name,
          nameAr: productTable.nameAr,
          imageUrl: productTable.imageUrl,
        })
        .from(productTable)
        .where(inArray(productTable.id, allProductIds))
    : []

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    items: ((r.items as TemplateItem[]) ?? []).map((item) => {
      const p = productMap[item.productId]
      return {
        productId: item.productId,
        qty: item.qty,
        product: p
          ? {
              id: p.id,
              nameAr: p.nameAr ?? p.name,
              nameEn: p.name,
              image: p.imageUrl ?? '/placeholder.png',
              supplierId: '',
              categorySlug: '',
              unitsPerCarton: 1,
              moq: 1,
              basePrice: 0,
              tiers: [],
            }
          : undefined,
      }
    }),
  }))
}

export async function saveReorderTemplate(
  name: string,
  items: { productId: string; qty: number }[],
  actor?: Actor,
): Promise<ReorderTemplate> {
  const userId = (await resolveActor(actor)).id
  const trimmedName = clip(name, 80)
  if (!trimmedName) throw new ValidationError('اسم القالب مطلوب')
  if (!items?.length || items.length > 100) throw new ValidationError('عدد أصناف القالب غير صالح')

  const cleanItems = items.slice(0, 100).map((i) => ({
    productId: clip(i.productId, 80),
    qty: Math.max(1, Math.min(100_000, Math.trunc(Number(i.qty) || 1))),
  }))

  const [row] = await db
    .insert(templateTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: trimmedName,
      items: cleanItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return {
    id: row.id,
    name: row.name,
    items: cleanItems.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      product: undefined,
    })),
  }
}
