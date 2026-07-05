'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Search, Plus, Store, LogIn, CheckCircle, XCircle, Ban } from 'lucide-react'
import { getAdminSuppliers } from '@/lib/api-client'
import { StatusChip } from '@/components/order-status'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

export default function AdminSuppliersPage() {
  const { t } = useI18n()
  const { error: toastError } = useToast()
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getAdminSuppliers>>>('admin/suppliers', getAdminSuppliers)
  const [q, setQ] = useState('')

  const [updating, setUpdating] = useState<string | null>(null)

  async function changeStatus(id: string, status: 'active' | 'pending' | 'suspended') {
    setUpdating(id)
    try {
      const res = await fetch('/api/v1/admin/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error(await res.text())
      mutate()
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setUpdating(null)
    }
  }

  async function loginAsStore(id: string) {
    try {
      const res = await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: id }),
      })
      if (!res.ok) throw new Error(await res.text())
      window.location.href = '/partner'
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-9 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => router.push('/partner/sign-up')}>
          <Plus className="size-4" />
          {t('addNew')}
        </Button>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton rows={5} cards={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={Store} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(suppliers) => {
          const filtered = suppliers.filter(
            (s) => !q || s.name.includes(q) || s.category.includes(q)
          )
          return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.category}</p>
                    </div>
                    <StatusChip status={s.status as Parameters<typeof StatusChip>[0]['status']} size="sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <p className="text-base font-bold text-foreground">{s.products}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierProducts')}</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{s.orders.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierOrders')}</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{s.rating}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierRating')}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                    <p className="text-[10px] text-muted-foreground">{t('supplierJoined')}: {s.joined}</p>
                    <div className="flex gap-1">
                      {s.status !== 'active' && (
                        <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-green-600 border-green-300 hover:bg-green-50" disabled={updating === s.id} onClick={() => changeStatus(s.id, 'active')}>
                          <CheckCircle className="size-3" /> تفعيل
                        </Button>
                      )}
                      {s.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-yellow-600 border-yellow-300 hover:bg-yellow-50" disabled={updating === s.id} onClick={() => changeStatus(s.id, 'suspended')}>
                          <XCircle className="size-3" /> إيقاف
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px]" onClick={() => loginAsStore(s.id)}>
                        <LogIn className="size-3" />
                        {t('loginAsStore')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">{t('noData')}</div>
              )}
            </div>
          )
        }}
      </AsyncContent>
    </div>
  )
}
