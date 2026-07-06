import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { listPublishedPosts } from '@/services/blog'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'المدونة | مورِد',
  description: 'مقالات ونصائح حول تجارة الجملة والتجزئة من مورِد.',
}

export default async function BlogPage() {
  const posts = await listPublishedPosts(1).catch(() => [])
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-foreground">المدونة</h1>
        {!posts.length ? (
          <p className="text-sm text-muted-foreground">لا توجد مقالات منشورة بعد.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
                <span className="relative block aspect-[16/9] bg-muted">
                  {p.coverImage && <Image src={p.coverImage} alt={p.titleAr} fill sizes="360px" className="object-cover" />}
                </span>
                <div className="p-4">
                  <h2 className="line-clamp-2 font-bold text-foreground group-hover:text-primary">{p.titleAr}</h2>
                  {p.excerptAr && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerptAr}</p>}
                  {p.publishedAt && (
                    <p className="mt-2 text-xs text-muted-foreground" dir="ltr">
                      {new Date(p.publishedAt).toLocaleDateString('ar')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
