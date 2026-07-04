import { PageShell } from '@/components/page-shell'
import { ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <ListSkeleton count={5} />
      </div>
    </PageShell>
  )
}
