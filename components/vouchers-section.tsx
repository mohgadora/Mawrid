'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Ticket, Copy, Check, Clock, BadgePercent, Truck, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { fetchAvailableCoupons, type AvailableCoupon } from '@/lib/api-client'
import { ListSkeleton } from '@/components/skeletons'

type VoucherType = 'percent' | 'fixed' | 'shipping'

function normalizeType(type: string): VoucherType {
  if (type === 'free_shipping') return 'shipping'
  if (type === 'fixed') return 'fixed'
  return 'percent'
}

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

/** وصف قصير للكوبون من بياناته إن لم يكن له عنوان مخصّص. */
function couponTitle(c: AvailableCoupon, lang: string): string {
  const title = lang === 'ar' ? c.titleAr : c.titleEn
  if (title) return title
  const value = Number(c.value)
  const t = normalizeType(c.type)
  if (t === 'shipping') return lang === 'ar' ? 'شحن مجاني' : 'Free shipping'
  if (t === 'percent') return lang === 'ar' ? `خصم ${value}%` : `${value}% off`
  return lang === 'ar' ? `خصم ${value}$` : `$${value} off`
}

function minOrderLabel(c: AvailableCoupon, lang: string): string {
  const min = c.minOrderAmount != null ? Number(c.minOrderAmount) : 0
  if (!min || min <= 0) return lang === 'ar' ? 'بدون حد أدنى' : 'No minimum'
  return lang === 'ar' ? `عند طلب بـ ${min}$ فأكثر` : `On orders $${min}+`
}

function expiryLabel(c: AvailableCoupon, lang: string): string {
  if (!c.expiresAt) return ''
  const ms = new Date(c.expiresAt).getTime() - Date.now()
  if (ms <= 0) return ''
  const days = Math.ceil(ms / 86_400_000)
  return lang === 'ar' ? `${days} يوم` : `${days}d`
}

export function VouchersSection() {
  const { lang } = useI18n()
  const { success } = useToast()
  const [copied, setCopied] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, error, isLoading, mutate } = useSWR<AvailableCoupon[]>('coupons', fetchAvailableCoupons)

  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current) }, [])

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    success(lang === 'ar' ? 'تم نسخ الكود!' : 'Code copied!')
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="mb-2 text-sm font-bold text-muted-foreground">
          {lang === 'ar' ? 'الكوبونات المتاحة' : 'Available coupons'}
        </h4>

        {isLoading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-destructive">
              {lang === 'ar' ? 'تعذّر تحميل الكوبونات' : 'Failed to load coupons'}
            </p>
            <button
              type="button"
              onClick={() => mutate()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              <RefreshCw className="size-4" />
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : !data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Ticket className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === 'ar' ? 'لا توجد كوبونات متاحة حالياً' : 'No coupons available right now'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((c) => {
              const type = normalizeType(c.type)
              const Icon = TYPE_ICON[type] ?? Ticket
              const clr = TYPE_COLOR[type] ?? 'text-muted-foreground'
              const expiresIn = expiryLabel(c, lang)
              return (
                <div key={c.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex">
                    <div className={cn('flex items-center justify-center p-4', clr.split(' ')[1])}>
                      <Icon className={cn('size-7', clr.split(' ')[0])} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="size-3 -ms-1.5 rounded-full bg-background border-e border-t border-border" />
                      <div className="h-16 border-s border-dashed border-border" />
                      <div className="size-3 -ms-1.5 rounded-full bg-background border-e border-b border-border" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="font-bold text-foreground">{couponTitle(c, lang)}</p>
                      <p className="text-xs text-muted-foreground">{minOrderLabel(c, lang)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="rounded-md border border-dashed border-border bg-muted px-2.5 py-1 text-xs font-black tracking-widest text-foreground">
                          {c.code}
                        </code>
                        <button
                          onClick={() => copyCode(c.code)}
                          aria-label={lang === 'ar' ? 'نسخ' : 'Copy'}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {copied === c.code ? (
                            <Check className="size-3.5 text-success" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    {expiresIn && (
                      <div className="flex flex-col items-center justify-center px-3 text-center">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="mt-1 text-[10px] text-muted-foreground leading-tight">{expiresIn}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {lang === 'ar'
          ? 'انسخ الكود واستخدمه عند الدفع للحصول على الخصم.'
          : 'Copy a code and apply it at checkout to get the discount.'}
      </p>
    </div>
  )
}
