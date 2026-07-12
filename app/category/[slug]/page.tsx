import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { CategoryView } from '@/components/views/category-view'
import { getCategories } from '@/services/catalog'
import { getSeoMeta } from '@/services/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categories = await getCategories().catch(() => [])
  const category = categories.find((c) => c.slug === slug)
  const seo = await getSeoMeta('category', slug)

  const name = category?.nameAr ?? category?.nameEn ?? slug
  const title = seo?.titleAr || `${name} | مورِد`
  const description = seo?.descriptionAr || `تسوّق ${name} بأسعار الجملة على مورِد`

  return {
    title,
    description,
    keywords: (seo?.keywords as string[] | null) ?? [name],
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <PageShell>
      <CategoryView slug={slug} />
    </PageShell>
  )
}
