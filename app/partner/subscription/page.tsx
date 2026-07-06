'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Crown, Check } from 'lucide-react'
import {
  fetchSubscriptionPlans,
  fetchPartnerSubscription,
  subscribePartnerApi,
  cancelPartnerSubscriptionApi,
  type SubscriptionPlanRow,
} from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

export default function PartnerSubscriptionPage() {
  const toast = useToast()
  const plansSWR = useSWR<SubscriptionPlanRow[]>('subscription-plans', fetchSubscriptionPlans)
  const currentSWR = useSWR('partner/subscription', fetchPartnerSubscription)
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [busy, setBusy] = useState<string | null>(null)

  const currentPlanId = currentSWR.data?.plan?.id

  async function subscribe(planId: string) {
    setBusy(planId)
    try {
      await subscribePartnerApi(planId, cycle)
      toast.success('تم تفعيل الاشتراك')
      currentSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الاشتراك')
    } finally {
      setBusy(null)
    }
  }

  async function cancel() {
    setBusy('cancel')
    try {
      await cancelPartnerSubscriptionApi()
      toast.success('تم إلغاء الاشتراك')
      currentSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر الإلغاء')
    } finally {
      setBusy(null)
    }
  }

  if (plansSWR.isLoading) return <AdminPageSkeleton />

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Crown className="size-6 text-primary" />
        اشتراك المتجر
      </h1>

      {currentSWR.data?.plan && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <div>
            <p className="text-sm text-muted-foreground">باقتك الحالية</p>
            <p className="text-lg font-bold text-foreground">{currentSWR.data.plan.nameAr}</p>
            {currentSWR.data.subscription && (
              <p className="text-xs text-muted-foreground">
                تنتهي في {new Date(currentSWR.data.subscription.currentPeriodEnd).toLocaleDateString('ar')}
              </p>
            )}
          </div>
          <button type="button" onClick={cancel} disabled={busy === 'cancel'} className="rounded-xl border border-destructive px-4 py-2 text-sm font-bold text-destructive disabled:opacity-50">
            إلغاء
          </button>
        </div>
      )}

      {/* Cycle toggle */}
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {(['monthly', 'yearly'] as const).map((c) => (
          <button key={c} type="button" onClick={() => setCycle(c)} className={cycle === c ? 'rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground' : 'rounded-lg px-4 py-1.5 text-sm font-medium text-muted-foreground'}>
            {c === 'monthly' ? 'شهري' : 'سنوي'}
          </button>
        ))}
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {(plansSWR.data ?? []).map((plan) => {
          const price = cycle === 'yearly' && plan.priceYearly ? Number(plan.priceYearly) : Number(plan.priceMonthly)
          const isCurrent = plan.id === currentPlanId
          return (
            <div key={plan.id} className={`flex flex-col rounded-2xl border bg-card p-5 ${isCurrent ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
              <p className="text-lg font-black text-foreground">{plan.nameAr}</p>
              <p className="mt-2 text-3xl font-black text-primary">
                ${price.toFixed(0)}
                <span className="text-sm font-medium text-muted-foreground">/{cycle === 'yearly' ? 'سنة' : 'شهر'}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground">
                {plan.commissionRate != null && (
                  <li className="flex items-center gap-2"><Check className="size-4 text-success" /> عمولة {Number(plan.commissionRate)}%</li>
                )}
                {plan.maxProducts != null && (
                  <li className="flex items-center gap-2"><Check className="size-4 text-success" /> حتى {plan.maxProducts} منتج</li>
                )}
                {plan.maxOrders != null && (
                  <li className="flex items-center gap-2"><Check className="size-4 text-success" /> حتى {plan.maxOrders} طلب/شهر</li>
                )}
                {(plan.features ?? []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="size-4 text-success" /> {f}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => subscribe(plan.id)}
                disabled={busy === plan.id || isCurrent}
                className="mt-5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {isCurrent ? 'باقتك الحالية' : busy === plan.id ? 'جارٍ...' : 'اشترك'}
              </button>
            </div>
          )
        })}
        {!plansSWR.data?.length && <p className="text-sm text-muted-foreground">لا توجد باقات متاحة حالياً</p>}
      </div>
    </div>
  )
}
