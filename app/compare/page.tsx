import { PageShell } from '@/components/page-shell'
import { CompareView } from '@/components/views/compare-view'
import { getProducts } from '@/services/catalog'
import type { Product } from '@/lib/data'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ ids?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams
  const ids = params.ids ? params.ids.split(',').filter(Boolean) : []

  // Fetch all products from DB, filter to requested IDs
  const allProducts = await getProducts()
  const products = ids
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as Product[]

  return (
    <PageShell>
      <CompareView products={products} />
    </PageShell>
  )
}
