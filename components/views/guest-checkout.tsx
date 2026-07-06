'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ShoppingCart, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useCart, priceForRoleSnapshot, type CartProductSnapshot } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { SHIPPING } from '@/lib/config'
import { fromCents, lineTotalCents, sumCents, toCents } from '@/lib/money'
import { createGuestOrderApi } from '@/lib/api-client'
import { EmptyState } from '@/components/empty-state'

type PaymentMethod = 'cod' | 'card' | 'bank'

export function GuestCheckout() {
  const { t, lang, formatPrice } = useI18n()
  const { items, clear } = useCart()
  const toast = useToast()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('cod')
  const [placing, setPlacing] = useState(false)
  const [placedRef, setPlacedRef] = useState<string | null>(null)

  const lines = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: i.snapshot ?? null }))
        .filter((l): l is { item: (typeof items)[0]; product: CartProductSnapshot } => l.product !== null),
    [items],
  )

  const totals = useMemo(() => {
    const subtotalCents = sumCents(lines.map(({ item, product }) => lineTotalCents(priceForRoleSnapshot(product, item.qty, 'guest'), item.qty)))
    const subtotalUsd = fromCents(subtotalCents)
    const shippingUsd = subtotalUsd > 0 && subtotalUsd < SHIPPING.freeOverUsd ? SHIPPING.flatUsd : 0
    return { subtotalUsd, shippingUsd, totalUsd: fromCents(toCents(subtotalUsd) + toCents(shippingUsd)) }
  }, [lines])

  const valid = fullName.trim() && /^\+?[0-9]{7,20}$/.test(phone.trim()) && line1.trim() && city.trim()

  async function placeOrder() {
    if (!valid || placing) return
    setPlacing(true)
    try {
      const order = await createGuestOrderApi({
        lines: lines.map(({ item }) => ({ productId: item.productId, qty: item.qty })),
        contact: { fullName: fullName.trim(), email: email.trim() || undefined, phone: phone.trim() },
        address: { label: 'الرئيسي', line1: line1.trim(), city: city.trim(), phone: phone.trim() },
        paymentMethod: payment,
      })
      clear()
      setPlacedRef(order.ref)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errorTitle'))
    } finally {
      setPlacing(false)
    }
  }

  if (placedRef) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-8" />
        </span>
        <h1 className="text-2xl font-black text-foreground">{lang === 'ar' ? 'تم استلام طلبك!' : 'Order received!'}</h1>
        <p className="mt-2 text-muted-foreground">
          {lang === 'ar' ? 'رقم الطلب' : 'Order reference'}: <span className="font-mono font-bold text-foreground" dir="ltr">{placedRef}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'ar' ? 'سنتواصل معك على رقمك لتأكيد التوصيل.' : "We'll contact you on your phone to confirm delivery."}
        </p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          {t('continueShopping')}
        </Link>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState icon={ShoppingCart} title={t('emptyCart')} description={t('emptyCartDesc')} actionLabel={t('continueShopping')} actionHref="/" />
      </div>
    )
  }

  const input = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <User className="size-4 text-primary" />
          {lang === 'ar' ? 'الشراء كضيف' : 'Checking out as guest'}
        </span>
        <Link href="/sign-in?from=/checkout" className="font-semibold text-primary hover:underline">
          {lang === 'ar' ? 'لديك حساب؟ سجّل الدخول' : 'Have an account? Sign in'}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-bold text-foreground">{lang === 'ar' ? 'بيانات التواصل' : 'Contact details'}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'} className={input} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={lang === 'ar' ? 'رقم الجوال' : 'Phone'} dir="ltr" className={input} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'} dir="ltr" className={`${input} sm:col-span-2`} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-bold text-foreground">{lang === 'ar' ? 'عنوان التوصيل' : 'Delivery address'}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder={lang === 'ar' ? 'العنوان' : 'Address line'} className={`${input} sm:col-span-2`} />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={lang === 'ar' ? 'المدينة' : 'City'} className={input} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-bold text-foreground">{t('paymentMethod')}</h2>
            <div className="flex flex-col gap-2">
              {(['cod', 'card', 'bank'] as const).map((key) => (
                <button key={key} type="button" onClick={() => setPayment(key)} className={`flex items-center justify-between rounded-xl border p-3 text-start text-sm transition-colors ${payment === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent'}`}>
                  <span className="font-medium text-foreground">{t(key)}</span>
                  <span className={`grid size-5 place-items-center rounded-full border-2 ${payment === key ? 'border-primary' : 'border-muted-foreground/40'}`}>
                    {payment === key && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-bold text-foreground">{t('orderSummary')}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{t('subtotal')}</dt><dd className="font-semibold text-foreground">{formatPrice(totals.subtotalUsd)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{t('shipping')}</dt><dd className="font-semibold text-foreground">{totals.shippingUsd === 0 ? <span className="text-success">{t('freeShipping')}</span> : formatPrice(totals.shippingUsd)}</dd></div>
              <div className="my-1 border-t border-border" />
              <div className="flex items-center justify-between"><dt className="font-bold text-foreground">{t('total')}</dt><dd className="text-xl font-black text-primary">{formatPrice(totals.totalUsd)}</dd></div>
            </dl>
            <button type="button" disabled={!valid || placing} onClick={placeOrder} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
              <Check className="size-4" />
              {placing ? t('loading') : t('placeOrder')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
