import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { getPublishedPost, getPostForMeta } from '@/services/blog'
import { siteUrl } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostForMeta(slug)
  if (!post) return { title: 'المدونة | مورِد' }
  const description = (post.excerptAr || post.bodyAr).slice(0, 200)
  return {
    title: `${post.titleAr} | مورِد`,
    description,
    openGraph: {
      title: post.titleAr,
      description,
      type: 'article',
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.titleAr,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <article>
          <h1 className="text-3xl font-black text-foreground text-balance">{post.titleAr}</h1>
          {post.publishedAt && (
            <p className="mt-2 text-sm text-muted-foreground" dir="ltr">
              {new Date(post.publishedAt).toLocaleDateString('ar')}
            </p>
          )}
          {post.coverImage && (
            <span className="relative mt-4 block aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
              <Image src={post.coverImage} alt={post.titleAr} fill sizes="768px" className="object-cover" />
            </span>
          )}
          <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground">{post.bodyAr}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
