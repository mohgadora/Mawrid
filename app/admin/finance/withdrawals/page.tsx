'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getAdminWithdrawals, updateAdminWithdrawal } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/lib/toast'

type Withdrawal = Awaited<ReturnType<typeof getAdminWithdrawals>>[number]

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'معلّق',
  approved:  'موافق عليه',
  completed: 'مكتمل',
  rejected:  'مرفوض',
}

export default function AdminWithdrawalsPage() {
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = useSWR('admin/finance/withdrawals', getAdminWithdrawals)
  const [acting, setActing] = useState<string | null>(null)

  async function act(id: string, status: 'approved' | 'rejected' | 'completed', reference?: string) {
    setActing(id)
    try {
      await updateAdminWithdrawal(id, { status, reference })
      await mutate()
      success(status === 'approved' ? 'تمت الموافقة' : status === 'completed' ? 'تم الصرف' : 'تم الرفض')
    } catch {
      toastError('فشل تنفيذ الإجراء')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="route-fade space-y-5">
      <div className="flex items-center gap-3">
        <DollarSign className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">طلبات السحب</h1>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={DollarSign} title="لا توجد طلبات سحب" />}
        onRetry={() => mutate()}
      >
        {(withdrawals) => (
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">{withdrawals.length} طلب</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">المورّد</th>
                    <th className="px-4 py-3 text-start font-medium">المبلغ</th>
                    <th className="px-4 py-3 text-start font-medium">البنك / IBAN</th>
                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                    <th className="px-4 py-3 text-start font-medium">المرجع</th>
                    <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                    <th className="px-4 py-3 text-start font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => {
                    const bank = (w.bankAccount ?? {}) as Record<string, string>
                    return (
                      <tr key={w.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{w.supplier}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {w.amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} {w.currency}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {bank.bankName && <p>{bank.bankName}</p>}
                          {bank.iban && <p className="font-mono">{bank.iban}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[w.status] ?? ''}`}>
                            {STATUS_LABEL[w.status] ?? w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {w.reference || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {w.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => act(w.id, 'approved')}
                                  disabled={acting === w.id}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50 transition-colors"
                                >
                                  <CheckCircle className="size-3.5" />
                                  موافقة
                                </button>
                                <button
                                  onClick={() => act(w.id, 'rejected')}
                                  disabled={acting === w.id}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle className="size-3.5" />
                                  رفض
                                </button>
                              </>
                            )}
                            {w.status === 'approved' && (
                              <button
                                onClick={() => act(w.id, 'completed')}
                                disabled={acting === w.id}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 disabled:opacity-50 transition-colors"
                              >
                                <Clock className="size-3.5" />
                                تأكيد الصرف
                              </button>
                            )}
                            {(w.status === 'completed' || w.status === 'rejected') && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
