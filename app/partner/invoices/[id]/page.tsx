'use client'

import { use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Printer } from 'lucide-react'
import { fetchPartnerInvoice } from '@/lib/api-client'
import { AsyncContent } from '@/components/async-content'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

export default function PartnerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, formatPrice } = useI18n()
  const { data, error, isLoading, mutate } = useSWR(`partner/invoice/${id}`, () => fetchPartnerInvoice(id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/partner/invoices" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowRight className="size-4 rtl:rotate-180" /> {t('back')}
        </Link>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="size-4" /> {t('printInvoice')}
        </Button>
      </div>
      <AsyncContent data={data} error={error} isLoading={isLoading} onRetry={() => mutate()}>
        {(inv) => (
          <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 print:border-0 print:shadow-none">
            <h1 className="text-xl font-bold">{t('printInvoice')}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{inv.reference}</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">{t('nameLabel')}</dt>
                <dd className="font-semibold">{inv.supplierName}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">{t('total')}</dt>
                <dd className="text-lg font-bold">{formatPrice(inv.amount)} {inv.currency}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">{t('statusLabel')}</dt>
                <dd className="font-semibold">{inv.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('approvalDate')}</dt>
                <dd>{new Date(inv.createdAt).toLocaleDateString('ar-SA')}</dd>
              </div>
            </dl>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
