import { PageShell } from '@/components/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { ListSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
        <div className="mt-6">
          <ListSkeleton count={3} />
        </div>
      </div>
    </PageShell>
  )
}
