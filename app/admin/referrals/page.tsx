'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Users } from 'lucide-react'
import { getAdminReferralsApi, rewardReferralApi, type AdminReferralApiData } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('ar-SA')}</p>
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  if (status === 'rewarded') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        تمت المكافأة
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
      معلّق
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const { data, error, isLoading, mutate } = useSWR<AdminReferralApiData>(
    'admin/referrals',
    getAdminReferralsApi,
  )

  const [rewarding, setRewarding] = useState<string | null>(null)
  const [rewardError, setRewardError] = useState<Record<string, string>>({})

  async function handleReward(id: string) {
    setRewarding(id)
    setRewardError((prev) => ({ ...prev, [id]: '' }))
    try {
      await rewardReferralApi(id)
      await mutate()
    } catch (e) {
      setRewardError((prev) => ({
        ...prev,
        [id]: e instanceof Error ? e.message : 'حدث خطأ',
      }))
    } finally {
      setRewarding(null)
    }
  }

  return (
    <div className="space-y-6 route-fade" dir="rtl">
      <h1 className="text-xl font-bold">نظام الإحالة</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="إجمالي الإحالات"    value={data?.stats.total              ?? 0} />
        <StatCard label="تمت مكافأتها"        value={data?.stats.rewarded           ?? 0} />
        <StatCard label="معلّقة"              value={data?.stats.pending            ?? 0} />
        <StatCard label="النقاط الممنوحة"    value={data?.stats.totalPointsAwarded ?? 0} />
      </div>

      {/* Referrals table */}
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={0} rows={6} />}
        isEmpty={(d) => d.referrals.length === 0}
        empty={<EmptyState icon={Users} title="لا توجد إحالات بعد" />}
        onRetry={() => mutate()}
      >
        {(d) => (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-start font-medium">المُحيل</th>
                    <th className="px-5 py-3 text-start font-medium">المُحال</th>
                    <th className="px-5 py-3 text-start font-medium">الرمز</th>
                    <th className="px-5 py-3 text-start font-medium">الحالة</th>
                    <th className="px-5 py-3 text-start font-medium">تاريخ الإنشاء</th>
                    <th className="px-5 py-3 text-start font-medium">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {d.referrals.map((ref) => (
                    <tr
                      key={ref.id}
                      className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 text-xs font-semibold">{ref.referrerName}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{ref.refereeName}</td>
                      <td className="px-5 py-3 text-xs font-mono">{ref.code}</td>
                      <td className="px-5 py-3">
                        <StatusChip status={ref.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(ref.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-5 py-3">
                        {ref.status === 'pending' ? (
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={rewarding === ref.id}
                              onClick={() => handleReward(ref.id)}
                            >
                              {rewarding === ref.id ? 'جارٍ…' : 'منح المكافأة'}
                            </Button>
                            {rewardError[ref.id] && (
                              <p className="text-[11px] text-destructive">{rewardError[ref.id]}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
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
