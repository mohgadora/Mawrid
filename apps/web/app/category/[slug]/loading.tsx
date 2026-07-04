import { PageShell } from '@/components/page-shell'
import { BrowseSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <BrowseSkeleton />
    </PageShell>
  )
}
