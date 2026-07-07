import 'server-only'

import { db } from '@/lib/db'
import { deliveryZone, shippingRule } from '@/lib/db/schema'
import { eq, asc, desc } from 'drizzle-orm'

// ── Zones ────────────────────────────────────────────────────────────────────

export async function getZones() {
  const zones = await db
    .select()
    .from(deliveryZone)
    .orderBy(desc(deliveryZone.active), asc(deliveryZone.name))

  const rules = await db.select().from(shippingRule).orderBy(asc(shippingRule.minOrderAmount))

  return zones.map((z) => ({
    id:             z.id,
    name:           z.name,
    nameAr:         z.nameAr,
    country:        z.country,
    shippingFee:    Number(z.shippingFee),
    freeOverAmount: z.freeOverAmount !== null ? Number(z.freeOverAmount) : null,
    estimatedDays:  z.estimatedDays,
    active:         z.active,
    createdAt:      z.createdAt,
    rules:          rules.filter((r) => r.zoneId === z.id).map(mapRule),
  }))
}

export async function getZone(id: string) {
  const [z] = await db.select().from(deliveryZone).where(eq(deliveryZone.id, id))
  if (!z) return null
  const rules = await db
    .select()
    .from(shippingRule)
    .where(eq(shippingRule.zoneId, id))
    .orderBy(asc(shippingRule.minOrderAmount))
  return {
    id:             z.id,
    name:           z.name,
    nameAr:         z.nameAr,
    country:        z.country,
    shippingFee:    Number(z.shippingFee),
    freeOverAmount: z.freeOverAmount !== null ? Number(z.freeOverAmount) : null,
    estimatedDays:  z.estimatedDays,
    active:         z.active,
    createdAt:      z.createdAt,
    rules:          rules.map(mapRule),
  }
}

export async function createZone(data: {
  name: string
  nameAr?: string
  country?: string
  shippingFee?: number
  freeOverAmount?: number | null
  estimatedDays?: number
  active?: boolean
}) {
  const [row] = await db
    .insert(deliveryZone)
    .values({
      name:           data.name.trim(),
      nameAr:         data.nameAr?.trim() ?? null,
      country:        data.country ?? 'SA',
      shippingFee:    String(Number(data.shippingFee ?? 0).toFixed(2)),
      freeOverAmount: data.freeOverAmount != null ? String(Number(data.freeOverAmount).toFixed(2)) : null,
      estimatedDays:  data.estimatedDays ?? 3,
      active:         data.active ?? true,
    })
    .returning()
  return row
}

export async function updateZone(
  id: string,
  data: Partial<{
    name: string
    nameAr: string | null
    country: string
    shippingFee: number
    freeOverAmount: number | null
    estimatedDays: number
    active: boolean
  }>,
) {
  const values: Record<string, unknown> = {}
  if (data.name !== undefined)           values.name           = data.name.trim()
  if (data.nameAr !== undefined)         values.nameAr         = data.nameAr
  if (data.country !== undefined)        values.country        = data.country
  if (data.shippingFee !== undefined)    values.shippingFee    = String(Number(data.shippingFee).toFixed(2))
  if ('freeOverAmount' in data)          values.freeOverAmount = data.freeOverAmount != null ? String(Number(data.freeOverAmount).toFixed(2)) : null
  if (data.estimatedDays !== undefined)  values.estimatedDays  = data.estimatedDays
  if (data.active !== undefined)         values.active         = data.active

  const [row] = await db
    .update(deliveryZone)
    .set(values)
    .where(eq(deliveryZone.id, id))
    .returning()
  return row
}

export async function deleteZone(id: string) {
  await db.delete(deliveryZone).where(eq(deliveryZone.id, id))
}

// ── Shipping Rules ───────────────────────────────────────────────────────────

function mapRule(r: typeof shippingRule.$inferSelect) {
  return {
    id:             r.id,
    zoneId:         r.zoneId,
    name:           r.name,
    minOrderAmount: Number(r.minOrderAmount),
    maxOrderAmount: r.maxOrderAmount !== null ? Number(r.maxOrderAmount) : null,
    freeAbove:      r.freeAbove !== null ? Number(r.freeAbove) : null,
    baseFee:        Number(r.baseFee),
    perKgFee:       Number(r.perKgFee),
    estimatedDays:  r.estimatedDays,
    active:         r.active,
    createdAt:      r.createdAt,
  }
}

export async function getShippingRules(zoneId: string) {
  const rows = await db
    .select()
    .from(shippingRule)
    .where(eq(shippingRule.zoneId, zoneId))
    .orderBy(asc(shippingRule.minOrderAmount))
  return rows.map(mapRule)
}

export async function createShippingRule(
  zoneId: string,
  data: {
    name: string
    minOrderAmount?: number
    maxOrderAmount?: number | null
    freeAbove?: number | null
    baseFee?: number
    perKgFee?: number
    estimatedDays?: number
    active?: boolean
  },
) {
  const [row] = await db
    .insert(shippingRule)
    .values({
      id:             crypto.randomUUID(),
      zoneId,
      name:           data.name.trim(),
      minOrderAmount: String(Number(data.minOrderAmount ?? 0).toFixed(2)),
      maxOrderAmount: data.maxOrderAmount != null ? String(Number(data.maxOrderAmount).toFixed(2)) : null,
      freeAbove:      data.freeAbove != null ? String(Number(data.freeAbove).toFixed(2)) : null,
      baseFee:        String(Number(data.baseFee ?? 0).toFixed(2)),
      perKgFee:       String(Number(data.perKgFee ?? 0).toFixed(2)),
      estimatedDays:  data.estimatedDays ?? 3,
      active:         data.active ?? true,
    })
    .returning()
  return mapRule(row)
}

export async function updateShippingRule(
  id: string,
  data: Partial<{
    name: string
    minOrderAmount: number
    maxOrderAmount: number | null
    freeAbove: number | null
    baseFee: number
    perKgFee: number
    estimatedDays: number
    active: boolean
  }>,
) {
  const values: Record<string, unknown> = {}
  if (data.name !== undefined)           values.name           = data.name.trim()
  if (data.minOrderAmount !== undefined) values.minOrderAmount = String(Number(data.minOrderAmount).toFixed(2))
  if ('maxOrderAmount' in data)          values.maxOrderAmount = data.maxOrderAmount != null ? String(Number(data.maxOrderAmount).toFixed(2)) : null
  if ('freeAbove' in data)               values.freeAbove      = data.freeAbove != null ? String(Number(data.freeAbove).toFixed(2)) : null
  if (data.baseFee !== undefined)        values.baseFee        = String(Number(data.baseFee).toFixed(2))
  if (data.perKgFee !== undefined)       values.perKgFee       = String(Number(data.perKgFee).toFixed(2))
  if (data.estimatedDays !== undefined)  values.estimatedDays  = data.estimatedDays
  if (data.active !== undefined)         values.active         = data.active

  const [row] = await db
    .update(shippingRule)
    .set(values)
    .where(eq(shippingRule.id, id))
    .returning()
  return mapRule(row)
}

export async function deleteShippingRule(id: string) {
  await db.delete(shippingRule).where(eq(shippingRule.id, id))
}

// ── Calculate Shipping ───────────────────────────────────────────────────────

export async function calculateShipping(
  zoneId: string,
  orderAmount: number,
  weightKg = 0,
): Promise<{ fee: number; estimatedDays: number; isFree: boolean }> {
  const rules = await db
    .select()
    .from(shippingRule)
    .where(eq(shippingRule.zoneId, zoneId))
    .orderBy(asc(shippingRule.minOrderAmount))

  const active = rules
    .filter((r) => r.active)
    .filter((r) => {
      const min = Number(r.minOrderAmount)
      const max = r.maxOrderAmount !== null ? Number(r.maxOrderAmount) : Infinity
      return orderAmount >= min && orderAmount <= max
    })

  if (active.length === 0) {
    // Fall back to zone default
    const [zone] = await db.select().from(deliveryZone).where(eq(deliveryZone.id, zoneId))
    if (!zone) return { fee: 0, estimatedDays: 3, isFree: false }
    const isFree = zone.freeOverAmount !== null && orderAmount >= Number(zone.freeOverAmount)
    return {
      fee:           isFree ? 0 : Number(zone.shippingFee),
      estimatedDays: zone.estimatedDays,
      isFree,
    }
  }

  const rule = active[0]
  const freeAbove = rule.freeAbove !== null ? Number(rule.freeAbove) : null
  const isFree = freeAbove !== null && orderAmount >= freeAbove
  const fee = isFree
    ? 0
    : Number(rule.baseFee) + Number(rule.perKgFee) * weightKg

  return { fee, estimatedDays: rule.estimatedDays, isFree }
}
