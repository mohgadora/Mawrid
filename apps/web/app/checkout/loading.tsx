import { PageShell } from '@/components/page-shell'
import { DetailPanelSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <DetailPanelSkeleton />
    </PageShell>
  )
}
