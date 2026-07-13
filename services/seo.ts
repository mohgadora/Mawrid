/**
 * services/seo.ts — per-entity SEO metadata overrides.
 *
 * يُستدعى getSeoMeta من generateMetadata (آمن للفشل — يُرجع null بدل أن يرمي).
 * الإدارة عبر لوحة الأدمن (upsert/list/delete).
 */
import 'server-only'
import { db } from '@/lib/db'
import { seoMeta } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

type DbSeo = typeof seoMeta.$inferSelect

const ENTITY_TYPES = ['product', 'category', 'supplier', 'page'] as const

/** يجلب SEO override لكيان. لا يرمي أبداً — الميتاداتا يجب ألا تُعطّل الصفحة. */
export async function getSeoMeta(entityType: string, entityId: string): Promise<DbSeo | null> {
  try {
    const [row] = await db
      .select()
      .from(seoMeta)
      .where(and(eq(seoMeta.entityType, entityType), eq(seoMeta.entityId, entityId)))
      .limit(1)
    return row ?? null
  } catch {
    return null
  }
}

export async function listSeoMeta(entityType?: string): Promise<DbSeo[]> {
  const q = db.select().from(seoMeta)
  const rows = entityType
    ? await q.where(eq(seoMeta.entityType, entityType)).orderBy(desc(seoMeta.updatedAt)).limit(500)
    : await q.orderBy(desc(seoMeta.updatedAt)).limit(500)
  return rows
}

export type SeoMetaInput = {
  entityType: string
  entityId: string
  titleAr?: string | null
  titleEn?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  keywords?: string[]
  ogImage?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean
}

export async function upsertSeoMeta(data: SeoMetaInput, adminId: string): Promise<DbSeo> {
  if (!(ENTITY_TYPES as readonly string[]).includes(data.entityType)) throw new ValidationError('نوع كيان غير صالح')
  if (!data.entityId?.trim()) throw new ValidationError('معرّف الكيان مطلوب')

  const values = {
    titleAr: data.titleAr ?? null,
    titleEn: data.titleEn ?? null,
    descriptionAr: data.descriptionAr ?? null,
    descriptionEn: data.descriptionEn ?? null,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String).slice(0, 30) : [],
    ogImage: data.ogImage ?? null,
    canonicalUrl: data.canonicalUrl ?? null,
    noIndex: data.noIndex ?? false,
    updatedAt: new Date(),
  }

  const [row] = await db
    .insert(seoMeta)
    .values({ id: crypto.randomUUID(), entityType: data.entityType, entityId: data.entityId.trim(), ...values })
    .onConflictDoUpdate({ target: [seoMeta.entityType, seoMeta.entityId], set: values })
    .returning()

  await writeAuditLog({ userId: adminId, action: 'seo.upsert', entity: 'seo_meta', entityId: row.id })
  return row
}

export async function deleteSeoMeta(id: string, adminId: string): Promise<void> {
  await db.delete(seoMeta).where(eq(seoMeta.id, id))
  await writeAuditLog({ userId: adminId, action: 'seo.delete', entity: 'seo_meta', entityId: id })
}
