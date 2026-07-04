import {
  CATEGORIES,
  PRODUCTS,
  SUPPLIERS,
  type Category,
  type Product,
  type Supplier,
} from '@/lib/data'
import { clone, delay } from './core'

/** All product categories. */
export async function getCategories(): Promise<Category[]> {
  return delay(clone(CATEGORIES))
}

/** Full product list. */
export async function getProducts(): Promise<Product[]> {
  return delay(clone(PRODUCTS))
}

/** A single product, or null when not found. */
export async function getProductById(id: string): Promise<Product | null> {
  const product = PRODUCTS.find((p) => p.id === id)
  return delay(product ? clone(product) : null)
}

/** Products in the same category (excluding the given product). */
export async function getRelatedProducts(product: Product, limit = 5): Promise<Product[]> {
  const related = PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
  ).slice(0, limit)
  return delay(clone(related))
}

export type CategoryResult = {
  category: Category | null
  products: Product[]
}

/** A category and its products. */
export async function getCategoryWithProducts(slug: string): Promise<CategoryResult> {
  const category = CATEGORIES.find((c) => c.slug === slug) ?? null
  const products = PRODUCTS.filter((p) => p.categorySlug === slug)
  return delay({ category: clone(category), products: clone(products) })
}

/** All suppliers. */
export async function getSuppliers(): Promise<Supplier[]> {
  return delay(clone(SUPPLIERS))
}

export type SupplierResult = {
  supplier: Supplier | null
  products: Product[]
}

/** A supplier profile and its products. */
export async function getSupplierWithProducts(id: string): Promise<SupplierResult> {
  const supplier = SUPPLIERS.find((s) => s.id === id) ?? null
  const products = PRODUCTS.filter((p) => p.supplierId === id)
  return delay({ supplier: clone(supplier), products: clone(products) })
}

/** Full-text search across product + supplier names. */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase()
  if (!q) return delay<Product[]>([])
  const matches = PRODUCTS.filter((p) =>
    [p.nameAr, p.nameEn, p.supplierAr, p.supplierEn].join(' ').toLowerCase().includes(q),
  )
  return delay(clone(matches))
}
