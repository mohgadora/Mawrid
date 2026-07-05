'use client'

import { useState } from 'react'
import { Ticket, Copy, Check, Clock, BadgePercent, Truck, ShoppingBag } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type VoucherType = 'percent' | 'fixed' | 'shipping'

type Voucher = {
  id: string
  code: string
  type: VoucherType
  value: number
  minOrderAr: string
  minOrderEn: string
  descAr: string
  descEn: string
  expiresIn: string
  used: boolean
}

const VOUCHERS: Voucher[] = [
  {
    id: '1',
    code: 'SAVE15',
    type: 'percent',
    value: 15,
    minOrderAr: 'عند طلب بـ 500 ريال فأكثر',
    minOrderEn: 'On orders SAR 500+',
    descAr: 'خصم 15% على طلبك التالي',
    descEn: '15% off your next order',
    expiresIn: '3 أيام / 3 days',
    used: false,
  },
  {
    id: '2',
    code: 'FREESHIP',
    type: 'shipping',
    value: 0,
    minOrderAr: 'بدون حد أدنى',
    minOrderEn: 'No minimum',
    descAr: 'شحن مجاني على طلبك القادم',
    descEn: 'Free shipping on your next order',
    expiresIn: '7 أيام / 7 days',
    used: false,
  },
  {
    id: '3',
    code: 'BULK50',
    type: 'fixed',
    value: 50,
    minOrderAr: 'عند طلب بـ 1000 ريال فأكثر',
    minOrderEn: 'On orders SAR 1,000+',
    descAr: 'خصم 50 ريال على الطلبات الكبيرة',
    descEn: 'SAR 50 off bulk orders',
    expiresIn: '14 أيام / 14 days',
    used: false,
  },
  {
    id: '4',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrderAr: 'بدون حد أدنى',
    minOrderEn: 'No minimum',
    descAr: 'خصم ترحيبي 10% — مستخدم',
    descEn: 'Welcome 10% off — Used',
    expiresIn: '',
    used: true,
  },
]

const TYPE_ICON: Record<VoucherType, typeof Ticket> = {
  percent: BadgePercent,
  fixed: ShoppingBag,
  shipping: Truck,
}

const TYPE_COLOR: Record<VoucherType, string> = {
  percent: 'text-primary bg-primary/15',
  fixed: 'text-chart-3 bg-chart-3/15',
  shipping: 'text-success bg-success/15',
}

export function VouchersSection() {
  const { lang } = useI18n()
  const { success } = useToast()
  const [copied, setCopied] = useState<string | null>(null)
  const [inputCode, setInputCode] = useState('')
  const [applying, setApplying] = useState(false)

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    success(lang === 'ar' ? 'تم نسخ الكود!' : 'Code copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  async function applyCode() {
    if (!inputCode.trim()) return
    setApplying(true)
    await new Promise((r) => setTimeout(r, 800))
    setApplying(false)
    success(lang === 'ar' ? 'سيتم تطبيق الكود عند الدفع' : 'Code will be applied at checkout')
    setInputCode('')
  }

  const active = VOUCHERS.filter((v) => !v.used)
  const used = VOUCHERS.filter((v) => v.used)

  return (
    <div className="flex flex-col gap-4">
      {/* Enter code */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-bold text-muted-foreground">
          {lang === 'ar' ? 'أدخل كود قسيمة' : 'Enter voucher code'}
        </h4>
        <div className="flex gap-2">
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder={lang === 'ar' ? 'مثال: SAVE15' : 'e.g. SAVE15'}
            dir="ltr"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={applyCode}
            disabled={applying || !inputCode.trim()}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {applying
              ? lang === 'ar' ? 'جارٍ...' : 'Applying...'
              : lang === 'ar' ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Active vouchers */}
      <div>
        <h4 className="mb-2 text-sm font-bold text-muted-foreground">
          {lang === 'ar' ? 'قسائمي المتاحة' : 'My active vouchers'}
        </h4>
        <div className="flex flex-col gap-3">
          {active.map((v) => {
            const Icon = TYPE_ICON[v.type] ?? Ticket
            const clr = TYPE_COLOR[v.type] ?? 'text-muted-foreground'
            return (
              <div
                key={v.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* Dashed divider */}
                <div className="flex">
                  <div className={cn('flex items-center justify-center p-4', clr.split(' ')[1])}>
                    <Icon className={cn('size-7', clr.split(' ')[0])} />
                  </div>
                  {/* Notch */}
                  <div className="flex flex-col justify-center">
                    <div className="size-3 -ms-1.5 rounded-full bg-background border-e border-t border-border" />
                    <div className="h-16 border-s border-dashed border-border" />
                    <div className="size-3 -ms-1.5 rounded-full bg-background border-e border-b border-border" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <p className="font-bold text-foreground">
                      {lang === 'ar' ? v.descAr : v.descEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar' ? v.minOrderAr : v.minOrderEn}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded-md border border-dashed border-border bg-muted px-2.5 py-1 text-xs font-black tracking-widest text-foreground">
                        {v.code}
                      </code>
                      <button
                        onClick={() => copyCode(v.code)}
                        aria-label={lang === 'ar' ? 'نسخ' : 'Copy'}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copied === v.code ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {v.expiresIn && (
                    <div className="flex flex-col items-center justify-center px-3 text-center">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="mt-1 text-[10px] text-muted-foreground leading-tight">
                        {v.expiresIn}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Used vouchers */}
      {used.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-bold text-muted-foreground">
            {lang === 'ar' ? 'قسائم مستخدمة' : 'Used vouchers'}
          </h4>
          <div className="flex flex-col gap-2">
            {used.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 opacity-60">
                <Ticket className="size-5 text-muted-foreground" />
                <code className="text-sm font-mono font-bold text-muted-foreground line-through">{v.code}</code>
                <span className="flex-1 text-sm text-muted-foreground">
                  {lang === 'ar' ? v.descAr : v.descEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
