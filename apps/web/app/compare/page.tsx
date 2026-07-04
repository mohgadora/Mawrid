import { PageShell } from '@/components/page-shell'
import { CompareView } from '@/components/views/compare-view'

interface Props {
  searchParams: Promise<{ ids?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams
  const ids = params.ids ? params.ids.split(',').filter(Boolean) : []
  return (
    <PageShell>
      <CompareView ids={ids} />
    </PageShell>
  )
}
