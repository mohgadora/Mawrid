import { PageShell } from '@/components/page-shell'
import { CategoryView } from '@/components/views/category-view'

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
