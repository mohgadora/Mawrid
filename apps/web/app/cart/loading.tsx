import { PageShell } from '@/components/page-shell'
import { CartSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <CartSkeleton />
    </PageShell>
  )
}
