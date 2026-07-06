/**
 * services/blog.ts — Blog posts + categories.
 * القراءة العامة تعرض المنشور المنشور فقط؛ الإدارة عبر الأدمن.
 */
import 'server-only'
import { db } from '@/lib/db'
import { blogPost, blogCategory } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

type DbPost = typeof blogPost.$inferSelect

function slugify(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || crypto.randomUUID().slice(0, 8)
}

export async function listCategories() {
  return db.select().from(blogCategory).orderBy(blogCategory.sortOrder).limit(100)
}

export type BlogListItem = {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  excerptAr: string | null
  coverImage: string | null
  publishedAt: string | null
  viewCount: number
}

/** المنشورات المنشورة (عامة) مع ترقيم صفحات. */
export async function listPublishedPosts(page = 1, pageSize = 12): Promise<BlogListItem[]> {
  const rows = await db
    .select({
      id: blogPost.id, slug: blogPost.slug, titleAr: blogPost.titleAr, titleEn: blogPost.titleEn,
      excerptAr: blogPost.excerptAr, coverImage: blogPost.coverImage, publishedAt: blogPost.publishedAt, viewCount: blogPost.viewCount,
    })
    .from(blogPost)
    .where(eq(blogPost.status, 'published'))
    .orderBy(desc(blogPost.publishedAt))
    .limit(pageSize)
    .offset(Math.max(0, (page - 1) * pageSize))
  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null }))
}

/** منشور منشور واحد بالـ slug (يزيد عدّاد المشاهدات). */
export async function getPublishedPost(slug: string): Promise<DbPost | null> {
  const [post] = await db.select().from(blogPost).where(and(eq(blogPost.slug, slug), eq(blogPost.status, 'published'))).limit(1)
  if (!post) return null
  await db.update(blogPost).set({ viewCount: sql`${blogPost.viewCount} + 1` }).where(eq(blogPost.id, post.id)).catch(() => {})
  return post
}

/** للميتاداتا فقط (لا يزيد المشاهدات). */
export async function getPostForMeta(slug: string): Promise<DbPost | null> {
  const [post] = await db.select().from(blogPost).where(and(eq(blogPost.slug, slug), eq(blogPost.status, 'published'))).limit(1)
  return post ?? null
}

export async function publishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db.select({ slug: blogPost.slug, updatedAt: blogPost.updatedAt }).from(blogPost).where(eq(blogPost.status, 'published')).limit(1000)
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function adminListPosts() {
  return db.select().from(blogPost).orderBy(desc(blogPost.createdAt)).limit(300)
}

export type BlogPostInput = {
  slug?: string
  titleAr: string
  titleEn?: string | null
  bodyAr: string
  bodyEn?: string | null
  excerptAr?: string | null
  excerptEn?: string | null
  coverImage?: string | null
  categoryId?: string | null
  status?: string
  tags?: string[]
}

export async function createPost(data: BlogPostInput, adminId: string): Promise<DbPost> {
  if (!data.titleAr?.trim()) throw new ValidationError('العنوان بالعربية مطلوب')
  if (!data.bodyAr?.trim()) throw new ValidationError('نص المقال بالعربية مطلوب')
  const slug = slugify(data.slug || data.titleEn || data.titleAr)

  const [existing] = await db.select({ id: blogPost.id }).from(blogPost).where(eq(blogPost.slug, slug)).limit(1)
  if (existing) throw new ValidationError('الرابط (slug) مستخدم بالفعل')

  const status = data.status === 'published' ? 'published' : 'draft'
  const [row] = await db
    .insert(blogPost)
    .values({
      id: crypto.randomUUID(),
      slug,
      titleAr: data.titleAr.trim(),
      titleEn: data.titleEn ?? null,
      bodyAr: data.bodyAr,
      bodyEn: data.bodyEn ?? null,
      excerptAr: data.excerptAr ?? null,
      excerptEn: data.excerptEn ?? null,
      coverImage: data.coverImage ?? null,
      categoryId: data.categoryId || null,
      authorId: adminId,
      status,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      publishedAt: status === 'published' ? new Date() : null,
    })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'blog.create', entity: 'blog_post', entityId: row.id })
  return row
}

export async function updatePost(id: string, data: Partial<BlogPostInput>, adminId: string): Promise<DbPost> {
  const [current] = await db.select().from(blogPost).where(eq(blogPost.id, id)).limit(1)
  if (!current) throw new NotFoundError('المقال غير موجود')

  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (data.titleAr !== undefined) set.titleAr = data.titleAr
  if (data.titleEn !== undefined) set.titleEn = data.titleEn
  if (data.bodyAr !== undefined) set.bodyAr = data.bodyAr
  if (data.bodyEn !== undefined) set.bodyEn = data.bodyEn
  if (data.excerptAr !== undefined) set.excerptAr = data.excerptAr
  if (data.excerptEn !== undefined) set.excerptEn = data.excerptEn
  if (data.coverImage !== undefined) set.coverImage = data.coverImage
  if (data.categoryId !== undefined) set.categoryId = data.categoryId || null
  if (data.tags !== undefined) set.tags = data.tags
  if (data.slug !== undefined && data.slug) set.slug = slugify(data.slug)
  if (data.status !== undefined) {
    set.status = data.status === 'published' ? 'published' : 'draft'
    // اضبط تاريخ النشر عند أول نشر
    if (data.status === 'published' && current.status !== 'published') set.publishedAt = new Date()
  }

  const [row] = await db.update(blogPost).set(set).where(eq(blogPost.id, id)).returning()
  await writeAuditLog({ userId: adminId, action: 'blog.update', entity: 'blog_post', entityId: id })
  return row
}

export async function deletePost(id: string, adminId: string): Promise<void> {
  await db.delete(blogPost).where(eq(blogPost.id, id))
  await writeAuditLog({ userId: adminId, action: 'blog.delete', entity: 'blog_post', entityId: id })
}
