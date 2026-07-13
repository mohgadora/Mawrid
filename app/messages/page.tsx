import { Suspense } from 'react'
import { PageShell } from '@/components/page-shell'
import { MessagesView } from '@/components/views/messages-view'

export default function MessagesPage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <MessagesView />
      </Suspense>
    </PageShell>
  )
}
