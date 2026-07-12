import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'
import { getProducts, getProduct } from '@/services/catalog'
import { getSeoMeta } from '@/services/seo'
import { siteUrl } from '@/lib/config'

// Always render server-side so the DB is reachable
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Mawrid' }

  const seo = await getSeoMeta('product', id)
  const title = seo?.titleAr || `${product.nameAr} | مورِد`
  const description =
    seo?.descriptionAr || product.descriptionAr || product.descriptionEn || product.nameAr
  const image = seo?.ogImage || product.image
  const keywords = ((seo?.keywords as string[] | null) ?? [product.nameAr, product.nameEn]).filter(Boolean)

  return {
    title,
    description: description.slice(0, 300),
    keywords,
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: description.slice(0, 300),
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const allProducts = await getProducts()
  const related = allProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 5)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameAr,
    image: product.image ? [product.image] : undefined,
    description: (product.descriptionAr || product.descriptionEn || product.nameAr).slice(0, 500),
    sku: product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.basePrice,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl()}/product/${product.id}`,
    },
    ...(product.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, ratingCount: 1 } } : {}),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <ProductDetail product={product} related={related} />
      </main>
      <SiteFooter />
    </div>
  )
}
