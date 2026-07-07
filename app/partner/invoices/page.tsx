'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { fetchPartnerInvoices } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { AdminStatusChip } from '@/components/admin/stat-card'
import { useI18n } from '@/lib/i18n'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PartnerInvoicesPage() {
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR('partner/invoices', fetchPartnerInvoices)

  return (
    <AsyncContent data={data} error={error} isLoading={isLoading} loading={<AdminPageSkeleton rows={6} cards={0} />} onRetry={() => mutate()}>
      {(invoices) => (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t('partnerNavInvoices')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('total')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('statusLabel')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{inv.reference || inv.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatPrice(inv.amount)}</td>
                  <td className="px-4 py-3"><AdminStatusChip status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/partner/invoices/${inv.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 gap-1 text-xs')}><Eye className="size-3.5" /> {t('printInvoice')}</Link>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AsyncContent>
  )
}
