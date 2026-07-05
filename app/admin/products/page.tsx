'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Search, Package, ToggleLeft, ToggleRight } from 'lucide-react'
import { getAdminProducts, toggleAdminProduct } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import Image from 'next/image'

type Product = Awaited<ReturnType<typeof getAdminProducts>>[number]

const STATUS_TABS = ['all', 'active', 'inactive'] as const
type Tab = (typeof STATUS_TABS)[number]

export default function AdminProductsPage() {
  const { t, formatPrice } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('admin/products', getAdminProducts)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [toggling, setToggling] = useState<string | null>(null)

  async function toggle(p: Product) {
    setToggling(p.id)
    try {
      await toggleAdminProduct(p.id, !p.active)
      await mutate()
      success(p.active ? 'تم تعطيل المنتج' : 'تم تفعيل المنتج')
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setToggling(null)
    }
  }

  const TAB_LABEL: Record<Tab, string> = {
    all:      t('filterAll'),
    active:   t('enabledLabel'),
    inactive: 'معطّل',
  }

  return (
    <div className="route-fade space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-9 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={Package} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(products) => {
          const filtered = products.filter((p) => {
            const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(q.toLowerCase())
            const matchTab = tab === 'all' || (tab === 'active' ? p.active : !p.active)
            return matchQ && matchTab
          })

          return (
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  {filtered.length} منتج
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-3 text-start font-medium">المنتج</th>
                      <th className="px-4 py-3 text-start font-medium">SKU</th>
                      <th className="px-4 py-3 text-start font-medium">المخزون</th>
                      <th className="px-4 py-3 text-start font-medium">الحالة</th>
                      <th className="px-4 py-3 text-start font-medium">تاريخ الإضافة</th>
                      <th className="px-4 py-3 text-start font-medium">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {p.imageUrl ? (
                                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="40px" />
                              ) : (
                                <Package className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground max-w-[200px]">{p.name}</p>
                              {p.nameAr && p.nameAr !== p.name && (
                                <p className="truncate text-xs text-muted-foreground max-w-[200px]">{p.nameAr}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.stock <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {p.active ? t('enabledLabel') : 'معطّل'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggle(p)}
                            disabled={toggling === p.id}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                            title={p.active ? 'تعطيل' : 'تفعيل'}
                          >
                            {p.active
                              ? <ToggleRight className="size-4 text-success" />
                              : <ToggleLeft className="size-4 text-muted-foreground" />
                            }
                            {p.active ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          لا توجد منتجات
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }}
      </AsyncContent>
    </div>
  )
}
