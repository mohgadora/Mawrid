import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/config'
import { getProducts, getCategories } from '@/services/catalog'
import { publishedSlugs } from '@/services/blog'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/search', '/coupons', '/flash-sales', '/clearance', '/blog',
  ].map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: 'daily', priority: path === '' ? 1 : 0.7 }))

  const [products, categories, posts] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
    publishedSlugs().catch(() => []),
  ])

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]
}
