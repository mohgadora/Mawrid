import { PageShell } from '@/components/page-shell'
import { SupplierView } from '@/components/views/supplier-view'

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <PageShell>
      <SupplierView id={id} />
    </PageShell>
  )
}
