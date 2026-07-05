'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Package, ShoppingCart, DollarSign, Store } from 'lucide-react'
import { fetchPartnerDashboard } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { useI18n } from '@/lib/i18n'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PartnerDashboardPage() {
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR('partner/dashboard', fetchPartnerDashboard)

  return (
    <div className="route-fade space-y-6">
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={4} rows={0} />}
        onRetry={() => mutate()}
      >
        {(dash) => (
          <>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{dash.store.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {dash.store.verified ? t('partnerVerified') : t('partnerPendingVerification')}
                  </p>
                </div>
                <Link href="/partner/store" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>{t('partnerNavStore')}</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon={Package} label={t('partnerNavProducts')} value={String(dash.kpi.products)} sub={`${dash.kpi.activeProducts} ${t('enabledLabel')}`} />
              <KpiCard icon={ShoppingCart} label={t('partnerNavOrders')} value={String(dash.kpi.orders)} />
              <KpiCard icon={DollarSign} label={t('partnerRevenue')} value={formatPrice(dash.kpi.revenue)} />
              <KpiCard icon={Store} label={t('partnerPendingPayouts')} value={String(dash.kpi.pendingPayouts)} />
            </div>
          </>
        )}
      </AsyncContent>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: typeof Package; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
