import { Suspense } from 'react'
import { PageShell } from '@/components/page-shell'
import { SearchView } from '@/components/views/search-view'

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6" />}>
        <SearchView />
      </Suspense>
    </PageShell>
  )
}
