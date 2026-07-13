'use client'

import { Ticket } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { VouchersSection } from '@/components/vouchers-section'

export function CouponsView() {
  const { lang } = useI18n()
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Ticket className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-black text-foreground">
            {lang === 'ar' ? 'الكوبونات والخصومات' : 'Coupons & Discounts'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'اكتشف الكوبونات المتاحة وطبّقها عند الدفع.'
              : 'Browse available coupons and apply them at checkout.'}
          </p>
        </div>
      </header>
      <VouchersSection />
    </div>
  )
}
