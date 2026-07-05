/**
 * services/catalog.ts — Catalog data layer backed by Neon/Drizzle.
 * Preserves the exact function signatures the UI depends on.
 * Falls back to lib/data mock arrays when DB is empty (development convenience).
 */
import 'server-only'
import { db } from '@/lib/db'
import {
  category,
  supplier,
  product,
  priceTier,
  type Category as DbCategory,
  type Supplier as DbSupplier,
  type Product as DbProduct,
  type PriceTier as DbPriceTier,
} from '@/lib/db/schema'
import { eq, ilike, or, and, asc, desc, inArray, avg, gte, lte, gt, sql, count } from 'drizzle-orm'
import { productReview } from '@/lib/db/schema'
import { getSetting } from '@/lib/settings'

// ── Re-export legacy types so pages keep their imports unchanged ───────────

export type { Category, Supplier, Product } from '@/lib/data'
import type { Category, Supplier, Product } from '@/lib/data'
import { CATEGORIES, SUPPLIERS, PRODUCTS, findCategory, descendantSlugs } from '@/lib/data'

// ── Mock fallback (dev only) ────────────────────────────────────────────────
// في الإنتاج يرجع الكتالوج نتيجة فارغة بدل بيانات وهمية، حتى لا نُخفي أعطال
// القاعدة (DATABASE_URL خاطئ، migration فاشل، ...). فعّله في dev فقط.
const USE_MOCK = process.env.ALLOW_MOCK_FALLBACK === 'true'

function mock<T>(label: string, data: T): T {
  if (!USE_MOCK) {
    console.warn(`[catalog] empty DB result for "${label}" — returning empty (mock disabled)`)
    return (Array.isArray(data) ? [] : undefined) as T
  }
  console.warn(`[catalog] mock fallback used for "${label}"`)
  return data
}

// Returns extra where conditions for storefront product queries based on settings
async function publicProductConditions() {
  const approvalRequired = await getSetting('productApprovalRequired')
  return approvalRequired ? [eq(product.active, true), eq(product.status, 'approved')] : [eq(product.active, true)]
}

let _catSlugCache: { at: number; map: Map<string, string> } | null = null
async function categorySlugById(): Promise<Map<string, string>> {
  if (_catSlugCache && Date.now() - _catSlugCache.at < 60_000) return _catSlugCache.map
  const rows = await db.select({ id: category.id, slug: category.slug }).from(category)
  const map = new Map(rows.map((r) => [r.id, r.slug]))
  _catSlugCache = { at: Date.now(), map }
  return map
}

// ── Helpers: map DB rows → legacy shape ──────────────────────────────────

function mapCategory(row: DbCategory): Category {
  return {
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.name,
    icon: row.icon ?? 'package',
    parentSlug: row.parentId ?? undefined,
  }
}

function mapSupplier(row: DbSupplier): Supplier {
  return {
    id: row.id,
    nameAr: row.nameAr ?? row.name,
    nameEn: row.name,
    verified: row.verified,
    rating: Number(row.rating),
    logo: row.logo ?? '/placeholder-logo.png',
    descriptionAr: '',
    descriptionEn: '',
    cityAr: row.city ?? '',
    cityEn: row.city ?? '',
    since: 2020,
  }
}

async function ratingsForProducts(productIds: string[]): Promise<Record<string, number>> {
  if (!productIds.length) return {}
  const rows = await db
    .select({ productId: productReview.productId, avg: avg(productReview.rating) })
    .from(productReview)
    .where(inArray(productReview.productId, productIds))
    .groupBy(productReview.productId)
  return Object.fromEntries(rows.map((r) => [r.productId, Math.round(Number(r.avg ?? 0) * 10) / 10]))
}

function mapProduct(row: DbProduct, tiers: DbPriceTier[], catSlugById?: Map<string, string>, rating = 0): Product {
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty)
  return {
    id: row.id,
    nameAr: row.nameAr ?? row.name,
    nameEn: row.name,
    categorySlug: (row.categoryId ? catSlugById?.get(row.categoryId) : undefined) ?? 'uncategorized',
    image: row.imageUrl ?? '/placeholder.png',
    supplierId: row.supplierId ?? '',
    supplierAr: '',
    supplierEn: '',
    verified: false,
    unitsPerCarton: row.unitsPerCarton,
    moq: sortedTiers[0]?.minQty ?? 1,
    basePrice: Number(sortedTiers[sortedTiers.length - 1]?.price ?? row.marketAvgPrice ?? 0),
    oldPrice: undefined,
    tiers: sortedTiers.map((t) => ({
      minQty: t.minQty,
      pricePerCarton: Number(t.price),
    })),
    sold: 0,
    rating,
    descriptionAr: row.descriptionAr ?? '',
    descriptionEn: row.description ?? '',
    marketPrice: Number(row.marketAvgPrice ?? 0),
    marketSources: 0,
    marketConfidence: 'medium' as const,
    marketUpdatedAt: new Date().toISOString().slice(0, 10),
  }
}

// ── Internal: fetch tiers for product IDs in one query ───────────────────

async function tiersForProducts(productIds: string[]): Promise<Record<string, DbPriceTier[]>> {
  if (!productIds.length) return {}
  const rows = await db
    .select()
    .from(priceTier)
    .where(inArray(priceTier.productId, productIds))
    .orderBy(asc(priceTier.sortOrder))
  const map: Record<string, DbPriceTier[]> = {}
  for (const row of rows) {
    if (!map[row.productId]) map[row.productId] = []
    map[row.productId].push(row)
  }
  return map
}

// ── Public API ────────────────────────────────────────────────────────────

/** Returns all categories from DB, falls back to mock if empty. */
export async function getCategories(): Promise<Category[]> {
  const rows = await db.select().from(category).orderBy(asc(category.sortOrder))
  if (!rows.length) return mock('categories', CATEGORIES)
  return rows.map(mapCategory)
}

/** Returns all suppliers, falls back to mock if DB empty. */
export async function getSuppliers(): Promise<Supplier[]> {
  const rows = await db.select().from(supplier).orderBy(desc(supplier.rating))
  if (!rows.length) return mock('suppliers', SUPPLIERS)
  return rows.map(mapSupplier)
}

/** Returns all products with tiers, falls back to mock if DB empty. */
export async function getProducts(): Promise<Product[]> {
  const conditions = await publicProductConditions()
  const rows = await db
    .select()
    .from(product)
    .where(and(...conditions))
    .orderBy(desc(product.featured), desc(product.createdAt))
  if (!rows.length) return mock('products', PRODUCTS)
  const ids = rows.map((r) => r.id)
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([tiersForProducts(ids), categorySlugById(), ratingsForProducts(ids)])
  return rows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug, ratingsMap[r.id] ?? 0))
}

/** Returns a single product by ID. */
export async function getProduct(id: string): Promise<Product | undefined> {
  const rows = await db.select().from(product).where(eq(product.id, id)).limit(1)
  if (!rows.length) return USE_MOCK ? PRODUCTS.find((p) => p.id === id) : undefined
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([tiersForProducts([id]), categorySlugById(), ratingsForProducts([id])])
  return mapProduct(rows[0], tiersMap[id] ?? [], catSlug, ratingsMap[id] ?? 0)
}

export type CategoryResult = { category: Category | null; products: Product[] }

export async function getCategoryWithProducts(slug: string): Promise<CategoryResult> {
  // Try DB category first
  const catRows = await db.select().from(category).where(eq(category.slug, slug)).limit(1)

  if (!catRows.length) {
    if (!USE_MOCK) return { category: null, products: [] }
    // dev-only mock fallback
    const cat = findCategory(slug) ?? null
    if (!cat) return { category: null, products: [] }
    const slugs = descendantSlugs(slug)
    const products = PRODUCTS.filter((p) => slugs.includes(p.categorySlug))
    return { category: cat, products }
  }

  const cat = mapCategory(catRows[0])
  // Find all category IDs that are descendants (by parentId chain)
  const allCatRows = await db.select().from(category)
  function getDescendantIds(id: string): string[] {
    const ids = [id]
    for (const row of allCatRows) {
      if (row.parentId === id) ids.push(...getDescendantIds(row.id))
    }
    return ids
  }
  const descendantIds = getDescendantIds(catRows[0].id)

  const conditions = await publicProductConditions()
  const productRows = await db
    .select()
    .from(product)
    .where(and(...conditions, inArray(product.categoryId, descendantIds)))
    .orderBy(desc(product.featured))

  if (!productRows.length) {
    return { category: cat, products: [] }
  }
  const ids = productRows.map((r) => r.id)
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([tiersForProducts(ids), categorySlugById(), ratingsForProducts(ids)])
  return { category: cat, products: productRows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug, ratingsMap[r.id] ?? 0)) }
}

export type SupplierResult = { supplier: Supplier | null; products: Product[] }

export async function getSupplierWithProducts(id: string): Promise<SupplierResult> {
  const supRows = await db.select().from(supplier).where(eq(supplier.id, id)).limit(1)
  if (!supRows.length) {
    if (!USE_MOCK) return { supplier: null, products: [] }
    const sup = SUPPLIERS.find((s) => s.id === id) ?? null
    if (!sup) return { supplier: null, products: [] }
    return { supplier: sup, products: PRODUCTS.filter((p) => p.supplierId === id) }
  }

  const sup = mapSupplier(supRows[0])
  const conditions = await publicProductConditions()
  const productRows = await db
    .select()
    .from(product)
    .where(and(eq(product.supplierId, id), ...conditions))
    .orderBy(desc(product.featured))

  const ids = productRows.map((r) => r.id)
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([tiersForProducts(ids), categorySlugById(), ratingsForProducts(ids)])
  return { supplier: sup, products: productRows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug, ratingsMap[r.id] ?? 0)) }
}

// ── Advanced Search ───────────────────────────────────────────────────────

export type SearchFilters = {
  query?: string
  categorySlug?: string
  supplierId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'relevance'
  page?: number
  limit?: number
}

export async function searchProductsAdvanced(filters: SearchFilters): Promise<{
  products: Product[]
  total: number
  page: number
  totalPages: number
}> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 24))
  const offset = (page - 1) * limit

  // Build WHERE conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [eq(product.active, true)]

  if (filters.query) {
    const q = filters.query.toLowerCase().trim()
    if (q) {
      conditions.push(
        or(
          ilike(product.name, `%${q}%`),
          ilike(product.nameAr ?? product.name, `%${q}%`),
          ilike(product.description ?? '', `%${q}%`),
        ),
      )
    }
  }

  if (filters.categorySlug) {
    const catRows = await db.select().from(category).where(eq(category.slug, filters.categorySlug)).limit(1)
    if (catRows.length) {
      const allCatRows = await db.select().from(category)
      function getDescendantIds(id: string): string[] {
        const ids = [id]
        for (const row of allCatRows) {
          if (row.parentId === id) ids.push(...getDescendantIds(row.id))
        }
        return ids
      }
      const descendantIds = getDescendantIds(catRows[0].id)
      conditions.push(inArray(product.categoryId, descendantIds))
    } else {
      // category not found → return empty
      return { products: [], total: 0, page, totalPages: 0 }
    }
  }

  if (filters.supplierId) {
    conditions.push(eq(product.supplierId, filters.supplierId))
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(sql`CAST(${product.marketAvgPrice} AS numeric)`, String(filters.minPrice)))
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(sql`CAST(${product.marketAvgPrice} AS numeric)`, String(filters.maxPrice)))
  }

  if (filters.inStock) {
    conditions.push(gt(product.stock, 0))
  }

  const whereClause = and(...conditions)

  // Count query
  const [countRow] = await db
    .select({ total: count() })
    .from(product)
    .where(whereClause)

  const total = Number(countRow?.total ?? 0)
  const totalPages = Math.ceil(total / limit)

  // Determine ordering (rating sort handled after fetch)
  let orderClause
  const sortBy = filters.sortBy ?? 'relevance'
  if (sortBy === 'price_asc') {
    orderClause = asc(product.marketAvgPrice)
  } else if (sortBy === 'price_desc') {
    orderClause = desc(product.marketAvgPrice)
  } else if (sortBy === 'newest') {
    orderClause = desc(product.createdAt)
  } else {
    // relevance / rating — default to featured then newest
    orderClause = desc(product.featured)
  }

  const rows = await db
    .select()
    .from(product)
    .where(whereClause)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset)

  if (!rows.length) return { products: [], total, page, totalPages }

  const ids = rows.map((r) => r.id)
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([
    tiersForProducts(ids),
    categorySlugById(),
    ratingsForProducts(ids),
  ])

  let products = rows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug, ratingsMap[r.id] ?? 0))

  // minRating filter (done after fetch since rating is computed)
  if (filters.minRating !== undefined) {
    products = products.filter((p) => p.rating >= (filters.minRating ?? 0))
  }

  // Sort by rating post-fetch if needed
  if (sortBy === 'rating') {
    products = products.sort((a, b) => b.rating - a.rating)
  }

  return { products, total, page, totalPages }
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const rows = await db
    .select()
    .from(product)
    .where(
      and(
        eq(product.active, true),
        or(
          ilike(product.name, `%${q}%`),
          ilike(product.nameAr ?? product.name, `%${q}%`),
          ilike(product.description ?? '', `%${q}%`),
        ),
      ),
    )
    .limit(50)

  if (!rows.length) {
    if (!USE_MOCK) return []
    return PRODUCTS.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.descriptionAr ?? '').toLowerCase().includes(q),
    )
  }

  const ids = rows.map((r) => r.id)
  const [tiersMap, catSlug, ratingsMap] = await Promise.all([tiersForProducts(ids), categorySlugById(), ratingsForProducts(ids)])
  return rows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug, ratingsMap[r.id] ?? 0))
}
