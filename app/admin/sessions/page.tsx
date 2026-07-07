'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, LogOut } from 'lucide-react'
import { getAdminSessions, revokeAdminSessionApi } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InboxIcon } from 'lucide-react'

export default function SessionsPage() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const [q, setQ] = useState('')
  const { data, error, isLoading, mutate } = useSWR('admin/sessions', getAdminSessions)

  const filtered = (data ?? []).filter(
    (s) => !q || s.user.includes(q) || s.ip.includes(q) || s.role.includes(q),
  )

  async function revoke(sessionId: string) {
    try {
      await revokeAdminSessionApi(sessionId)
      await mutate()
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('searchPlaceholder')} className="h-9 ps-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton rows={6} cards={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {() => (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">المستخدم</th>
                  <th className="px-5 py-3 text-start font-medium">الدور</th>
                  <th className="px-5 py-3 text-start font-medium">الجهاز</th>
                  <th className="px-5 py-3 text-start font-medium">IP</th>
                  <th className="px-5 py-3 text-start font-medium">آخر نشاط</th>
                  <th className="px-5 py-3 text-start font-medium">الحالة</th>
                  <th className="px-5 py-3 text-start font-medium">{t('actionLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.sessionId} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 text-xs font-medium">{s.user}</td>
                    <td className="px-5 py-3 text-xs">{s.role}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground" dir="ltr">{s.device}</td>
                    <td className="px-5 py-3 text-xs" dir="ltr">{s.ip}</td>
                    <td className="px-5 py-3 text-xs" dir="ltr">{new Date(s.lastSeen).toLocaleString()}</td>
                    <td className="px-5 py-3"><AdminStatusChip status={s.status} /></td>
                    <td className="px-5 py-3">
                      {s.status === 'active' && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive" onClick={() => revoke(s.sessionId)}>
                          <LogOut className="size-3.5" />
                          إنهاء
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
