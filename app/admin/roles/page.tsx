'use client'

import useSWR from 'swr'
import { ShieldCheck, Users, Plus, Check, Minus, InboxIcon } from 'lucide-react'
import { getAdminRoles, getPermissionMatrix } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

export default function RolesPage() {
  const { t } = useI18n()
  const rolesSwr  = useSWR<Awaited<ReturnType<typeof getAdminRoles>>>('admin/roles',   getAdminRoles)
  const matrixSwr = useSWR<Awaited<ReturnType<typeof getPermissionMatrix>>>('admin/perms',   getPermissionMatrix)

  if (rolesSwr.isLoading) return <AdminPageSkeleton cards={5} rows={5} />

  return (
    <div className="space-y-6 route-fade">
      {/* Role cards */}
      <AsyncContent
        data={rolesSwr.data}
        error={rolesSwr.error}
        isLoading={rolesSwr.isLoading}
        loading={<AdminPageSkeleton cards={5} rows={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => rolesSwr.mutate()}
      >
        {(roles) => (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-primary/10">
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" /> {role.users}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground leading-snug">{role.name}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{role.description}</p>
            <Button size="sm" variant="outline" className="mt-3 h-7 w-full text-xs">
              {t('editPermissions')}
            </Button>
          </div>
        ))}
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 p-4">
          <div className="grid size-9 place-items-center rounded-lg bg-muted">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <p className="text-center text-xs text-muted-foreground">{t('addRole')}</p>
        </div>
      </div>
        )}
      </AsyncContent>

      {/* Permission matrix */}
      <AsyncContent
        data={matrixSwr.data}
        error={matrixSwr.error}
        isLoading={matrixSwr.isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={InboxIcon} title={t('noData')} />}
        onRetry={() => matrixSwr.mutate()}
      >
        {(matrix) => (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-bold text-foreground">{t('permissionMatrix')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('permissionMatrixDesc')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start font-medium">{t('moduleLabel')}</th>
                <th className="px-5 py-3 text-center font-medium">Super Admin</th>
                <th className="px-5 py-3 text-center font-medium">Ops Manager</th>
                <th className="px-5 py-3 text-center font-medium">Finance</th>
                <th className="px-5 py-3 text-center font-medium">Support</th>
                <th className="px-5 py-3 text-center font-medium">Content</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.module} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{row.module}</td>
                  {([row.superAdmin, row.opsManager, row.finance, row.support, row.content] as boolean[]).map((allowed, i) => (
                    <td key={i} className="px-5 py-3 text-center">
                      {allowed ? (
                        <span className="inline-grid size-5 place-items-center rounded-full bg-primary/10">
                          <Check className="size-3 text-primary" />
                        </span>
                      ) : (
                        <span className="inline-grid size-5 place-items-center rounded-full bg-muted">
                          <Minus className="size-3 text-muted-foreground" />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        )}
      </AsyncContent>
    </div>
  )
}
