'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Check, X, Eye, ClipboardCheck } from 'lucide-react'
import { getApprovals, updateApprovalApi } from '@/lib/api-client'
import type { ApprovalCategory } from '@/services/admin'
import { StatusChip } from '@/components/order-status'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

type PendingProduct = { id: string; name: string | null; sku: string | null; supplierId: string | null; supplierName: string; imageUrl: string | null; createdAt: string; status: string }

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data)

const TYPE_LABEL_KEYS: Record<ApprovalCategory, string> = {
  kyc: 'approvalTypeKyc',
  supplier: 'approvalTypeSupplier',
  product: 'approvalTypeProduct',
  promotion: 'approvalTypePromotion',
  review: 'approvalTypeReview',
  refund: 'approvalTypeRefund',
  price: 'approvalTypePrice',
} as const

type ApprovalItem = Awaited<ReturnType<typeof getApprovals>>[number]

export default function ApprovalsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR<ApprovalItem[]>('admin/approvals', getApprovals)
  const { data: pendingProducts, mutate: mutatePending } = useSWR<PendingProduct[]>('/api/v1/admin/products/pending', fetcher)
  const [tab, setTab] = useState<ApprovalCategory | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [acting, setActing] = useState<string | null>(null)

  async function productAction(id: string, action: 'approve' | 'reject') {
    setActing(id)
    try {
      await fetch(`/api/v1/admin/products/${id}/${action}`, { method: 'POST' })
      await mutatePending()
      success(t('toastApprovalUpdated'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setActing(null)
    }
  }

  async function applyAction(id: string, action: 'approved' | 'rejected') {
    setActing(id)
    try {
      await updateApprovalApi(id, action)
      await mutate()
      success(t('toastApprovalUpdated'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setActing(null)
    }
  }

  async function bulkAction(action: 'approved' | 'rejected') {
    const ids = [...selected]
    setActing('bulk')
    try {
      await Promise.all(ids.map((id) => updateApprovalApi(id, action)))
      await mutate()
      setSelected(new Set())
      success(t('toastApprovalUpdated'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setActing(null)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const TABS: { key: ApprovalCategory | 'all'; labelKey: string }[] = [
    { key: 'all', labelKey: 'filterAll' },
    { key: 'kyc', labelKey: 'approvalTypeKyc' },
    { key: 'supplier', labelKey: 'approvalTypeSupplier' },
    { key: 'product', labelKey: 'approvalTypeProduct' },
    { key: 'promotion', labelKey: 'approvalTypePromotion' },
    { key: 'review', labelKey: 'approvalTypeReview' },
    { key: 'refund', labelKey: 'approvalTypeRefund' },
    { key: 'price', labelKey: 'approvalTypePrice' },
  ]

  return (
    <div className="space-y-8 route-fade">
      {/* Pending Products Section */}
      {pendingProducts && pendingProducts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">منتجات تنتظر الاعتماد</h2>
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">المنتج</th>
                    <th className="px-4 py-3 text-start font-medium">المورد</th>
                    <th className="px-4 py-3 text-start font-medium">SKU</th>
                    <th className="px-4 py-3 text-start font-medium">تاريخ الإضافة</th>
                    <th className="px-4 py-3 text-start font-medium">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProducts.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.supplierName || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.createdAt ? p.createdAt.slice(0, 10) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 gap-1 px-2 text-xs border-success/40 text-success hover:bg-success/10"
                            disabled={acting !== null}
                            onClick={() => productAction(p.id, 'approve')}
                          >
                            <Check className="size-3" /> اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 gap-1 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                            disabled={acting !== null}
                            onClick={() => productAction(p.id, 'reject')}
                          >
                            <X className="size-3" /> رفض
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton rows={8} cards={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={ClipboardCheck} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(allItems) => {
          const filtered = tab === 'all' ? allItems : allItems.filter((a) => a.type === tab)
          const pending = filtered.filter((a) => a.status === 'pending')
          const busy = acting !== null
          return (
            <>
              <div className="flex flex-wrap gap-1.5">
                {TABS.map((tb) => {
                  const count = tb.key === 'all'
                    ? allItems.filter((a) => a.status === 'pending').length
                    : allItems.filter((a) => a.type === tb.key && a.status === 'pending').length
                  return (
                    <button
                      key={tb.key}
                      onClick={() => setTab(tb.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        tab === tb.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {t(tb.labelKey as Parameters<typeof t>[0])}
                      {count > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                          tab === tb.key ? 'bg-white/20 text-white' : 'bg-destructive/10 text-destructive'
                        }`}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {selected.size > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
                  <span className="text-xs font-medium text-foreground">
                    {selected.size} {t('itemsLabel' as Parameters<typeof t>[0]) ?? 'عناصر محددة'}
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs text-success border-success/30 hover:bg-success/10"
                    disabled={busy}
                    onClick={() => bulkAction('approved')}
                  >
                    <Check className="size-3.5" /> {t('approveBtn')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={busy}
                    onClick={() => bulkAction('rejected')}
                  >
                    <X className="size-3.5" /> {t('rejectBtn')}
                  </Button>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="w-10 px-4 py-3">
                          <input type="checkbox" className="rounded"
                            checked={selected.size === pending.length && pending.length > 0}
                            onChange={() => {
                              if (selected.size === pending.length) setSelected(new Set())
                              else setSelected(new Set(pending.map((a) => a.id)))
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-start font-medium">{t('supplierId')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('approvalType')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('nameLabel')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('approvalPriority')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('approvalDate')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('statusLabel')}</th>
                        <th className="px-4 py-3 text-start font-medium">{t('approvalAction')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            {a.status === 'pending' && (
                              <input type="checkbox" className="rounded" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} />
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              {t(TYPE_LABEL_KEYS[a.type] as Parameters<typeof t>[0])}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-foreground">{a.title}</p>
                            <p className="text-[11px] text-muted-foreground">{a.subtitle}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${
                              a.priority === 'high' ? 'text-destructive' : a.priority === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'
                            }`}>
                              {a.priority === 'high' ? t('priorityHigh') : a.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.submittedAt}</td>
                          <td className="px-4 py-3"><StatusChip status={a.status as Parameters<typeof StatusChip>[0]['status']} size="sm" /></td>
                          <td className="px-4 py-3">
                            {a.status === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-success/40 text-success hover:bg-success/10"
                                  disabled={busy}
                                  onClick={() => applyAction(a.id, 'approved')}
                                >
                                  <Check className="size-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                                  disabled={busy}
                                  onClick={() => applyAction(a.id, 'rejected')}
                                >
                                  <X className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => router.push(`/admin/approvals/${a.id}`)}>
                                <Eye className="size-3 me-1" /> {t('viewProfile')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        }}
      </AsyncContent>
    </div>
  )
}
