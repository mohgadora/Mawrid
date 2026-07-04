import { PageShell } from '@/components/page-shell'
import { HomeSkeleton } from '@/components/skeletons'

/** Instant shell shown during navigation so a click never feels frozen. */
export default function Loading() {
  return (
    <PageShell>
      <HomeSkeleton />
    </PageShell>
  )
}
