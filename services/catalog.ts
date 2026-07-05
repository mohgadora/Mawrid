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
import { eq, ilike, or, and, asc, desc, inArray } from 'drizzle-orm'

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

function mapProduct(row: DbProduct, tiers: DbPriceTier[], catSlugById?: Map<string, string>): Product {
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
    rating: 4.5,
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
  const rows = await db
    .select()
    .from(product)
    .where(eq(product.active, true))
    .orderBy(desc(product.featured), desc(product.createdAt))
  if (!rows.length) return mock('products', PRODUCTS)
  const [tiersMap, catSlug] = await Promise.all([tiersForProducts(rows.map((r) => r.id)), categorySlugById()])
  return rows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug))
}

/** Returns a single product by ID. */
export async function getProduct(id: string): Promise<Product | undefined> {
  const rows = await db.select().from(product).where(eq(product.id, id)).limit(1)
  if (!rows.length) return USE_MOCK ? PRODUCTS.find((p) => p.id === id) : undefined
  const [tiersMap, catSlug] = await Promise.all([tiersForProducts([id]), categorySlugById()])
  return mapProduct(rows[0], tiersMap[id] ?? [], catSlug)
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

  const productRows = await db
    .select()
    .from(product)
    .where(and(eq(product.active, true), inArray(product.categoryId, descendantIds)))
    .orderBy(desc(product.featured))

  if (!productRows.length) {
    return { category: cat, products: [] }
  }
  const [tiersMap, catSlug] = await Promise.all([tiersForProducts(productRows.map((r) => r.id)), categorySlugById()])
  return { category: cat, products: productRows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug)) }
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
  const productRows = await db
    .select()
    .from(product)
    .where(and(eq(product.supplierId, id), eq(product.active, true)))
    .orderBy(desc(product.featured))

  const [tiersMap, catSlug] = await Promise.all([tiersForProducts(productRows.map((r) => r.id)), categorySlugById()])
  return { supplier: sup, products: productRows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug)) }
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

  const [tiersMap, catSlug] = await Promise.all([tiersForProducts(rows.map((r) => r.id)), categorySlugById()])
  return rows.map((r) => mapProduct(r, tiersMap[r.id] ?? [], catSlug))
}
