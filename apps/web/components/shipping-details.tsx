'use client'

import { useState } from 'react'
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  PackageCheck,
  Banknote,
  BadgeAlert,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SHIPPING } from '@/lib/config'
import { cn } from '@/lib/utils'

interface ShippingDetailsProps {
  basePrice: number
  moq: number
}

export function ShippingDetails({ basePrice, moq }: ShippingDetailsProps) {
  const { lang, formatPrice } = useI18n()
  const [open, setOpen] = useState(false)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  // Estimate delivery date range (next business day = today + 1, express = today + 1-3)
  const today = new Date()
  const express = new Date(today)
  express.setDate(today.getDate() + 1)
  const standard = new Date(today)
  standard.setDate(today.getDate() + 3)
  const standardEnd = new Date(today)
  standardEnd.setDate(today.getDate() + 5)

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  const orderTotal = basePrice * moq

  const shippingFee =
    orderTotal >= SHIPPING.freeOverUsd ? 0 : SHIPPING.flatUsd

  const rows: { icon: typeof Truck; label: string; value: string; highlight?: boolean }[] = [
    {
      icon: Truck,
      label: t('التوصيل القياسي', 'Standard Delivery'),
      value:
        shippingFee === 0
          ? `${t('مجاني', 'Free')} — ${fmtDate(standard)} – ${fmtDate(standardEnd)}`
          : `${formatPrice(shippingFee)} — ${fmtDate(standard)} – ${fmtDate(standardEnd)}`,
      highlight: shippingFee === 0,
    },
    {
      icon: Clock,
      label: t('التوصيل السريع', 'Express Delivery'),
      value: `${formatPrice(SHIPPING.flatUsd * 1.8)} — ${fmtDate(express)}`,
    },
    {
      icon: PackageCheck,
      label: t('حد الشحن المجاني', 'Free shipping on orders over'),
      value: formatPrice(SHIPPING.freeOverUsd),
    },
    {
      icon: RotateCcw,
      label: t('سياسة الإرجاع', 'Returns'),
      value: t('إرجاع مجاني خلال 7 أيام من الاستلام', 'Free returns within 7 days of delivery'),
    },
    {
      icon: ShieldCheck,
      label: t('ضمان المنتج', 'Product Guarantee'),
      value: t('جميع المنتجات مضمونة أو نعيد المبلغ كاملاً', 'All products guaranteed or full refund'),
    },
    {
      icon: Banknote,
      label: t('الدفع عند الاستلام', 'Cash on Delivery'),
      value: t('متاح لجميع الطلبات', 'Available for all orders'),
    },
  ]

  // The first 3 rows always show; the rest expand
  const visible = rows.slice(0, 3)
  const hidden = rows.slice(3)

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <Truck className="size-4 text-primary" />
        <h2 className="font-bold text-foreground">
          {t('تفاصيل الشحن والتوصيل', 'Shipping & Delivery')}
        </h2>
      </div>

      <div className="divide-y divide-border">
        {visible.map((row) => (
          <ShippingRow key={row.label} {...row} />
        ))}

        {/* Expandable section */}
        {open &&
          hidden.map((row) => (
            <ShippingRow key={row.label} {...row} />
          ))}
      </div>

      {/* Expand / collapse */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? (
          <>
            <ChevronUp className="size-3.5" />
            {t('عرض أقل', 'Show less')}
          </>
        ) : (
          <>
            <ChevronDown className="size-3.5" />
            {t('عرض المزيد عن الشحن والإرجاع', 'See shipping & return policy')}
          </>
        )}
      </button>

      {/* Bulk shipping note */}
      <div className="flex items-start gap-2 border-t border-border bg-accent/30 px-4 py-3">
        <BadgeAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(
            'للطلبات بالجملة الكبيرة (أكثر من 100 كرتون)، يرجى التواصل مع فريق المبيعات للحصول على عرض شحن مخصص.',
            'For large bulk orders (100+ cartons), contact our sales team for a custom freight quote.',
          )}
        </p>
      </div>
    </div>
  )
}

function ShippingRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Truck
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
          highlight ? 'bg-success/15' : 'bg-accent',
        )}
      >
        <Icon className={cn('size-3.5', highlight ? 'text-success' : 'text-primary')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p
          className={cn(
            'mt-0.5 text-xs leading-snug',
            highlight ? 'font-semibold text-success' : 'text-muted-foreground',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
