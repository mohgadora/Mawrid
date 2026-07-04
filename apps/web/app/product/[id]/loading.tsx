import { PageShell } from '@/components/page-shell'
import { ProductDetailSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <ProductDetailSkeleton />
    </PageShell>
  )
}
