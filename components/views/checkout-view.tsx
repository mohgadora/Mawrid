'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Truck,
  Wallet,
  CreditCard,
  Building2,
  Check,
  ChevronLeft,
  TrendingDown,
  ShoppingCart,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import {
  useCart,
  priceForRoleSnapshot,
  marketSavingsSnapshot,
  type CartProductSnapshot,
} from '@/lib/cart'
import { useRole } from '@/lib/role'
import { useToast } from '@/lib/toast'
import { SHIPPING } from '@/lib/config'
import { fromCents, lineTotalCents, sumCents, toCents } from '@/lib/money'
import { fetchAddresses, createOrderApi, type Address } from '@/lib/api-client'
import { EmptyState } from '@/components/empty-state'
import { ListSkeleton } from '@/components/skeletons'
import { cn } from '@/lib/utils'

type PaymentMethod = 'cod' | 'card' | 'bank'

const STEP_KEYS = ['stepAddress', 'stepDelivery', 'stepPayment'] as const

export function CheckoutView() {
  const { t, lang, dir, formatPrice } = useI18n()
  const { items, clear } = useCart()
  const { role } = useRole()
  const toast = useToast()
  const router = useRouter()

  const {
    data: addresses,
    error: addressError,
    isLoading: addressesLoading,
    mutate: reloadAddresses,
  } = useSWR<Address[]>('addresses', fetchAddresses)

  const [step, setStep] = useState(0)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [day, setDay] = useState<'today' | 'tomorrow'>('tomorrow')
  const [slot, setSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [payment, setPayment] = useState<PaymentMethod>('cod')
  const [placing, setPlacing] = useState(false)

  const lines = useMemo(
    () =>
      items
        .map((i) => ({ item: i, product: i.snapshot ?? null }))
        .filter((l): l is { item: (typeof items)[0]; product: CartProductSnapshot } =>
          l.product !== null,
        ),
    [items],
  )

  const totals = useMemo(() => {
    const subtotalCents = sumCents(
      lines.map(({ item, product }) =>
        lineTotalCents(priceForRoleSnapshot(product, item.qty, role), item.qty),
      ),
    )
    const savingsCents = sumCents(
      lines.map(({ item, product }) =>
        toCents(
          marketSavingsSnapshot(
            product,
            priceForRoleSnapshot(product, item.qty, role),
            item.qty,
          ),
        ),
      ),
    )
    const subtotalUsd = fromCents(subtotalCents)
    const shippingUsd =
      subtotalUsd > 0 && subtotalUsd < SHIPPING.freeOverUsd ? SHIPPING.flatUsd : 0
    return {
      subtotalUsd,
      shippingUsd,
      totalUsd: subtotalUsd + shippingUsd,
      savingsUsd: fromCents(savingsCents),
    }
  }, [lines, role])

  const selectedAddress = useMemo(() => {
    if (!addresses?.length) return null
    return addresses.find((a) => a.id === addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0]
  }, [addresses, addressId])

  const slotLabels = {
    morning: t('morning'),
    afternoon: t('afternoon'),
    evening: t('evening'),
  }

  if (items.length > 0 && lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title={lang === 'ar' ? 'سلة غير مكتملة' : 'Incomplete cart'}
          description={
            lang === 'ar'
              ? 'بعض المنتجات في السلة قديمة. أعد إضافتها من الكتالوج.'
              : 'Some cart items are outdated. Re-add them from the catalog.'
          }
          actionLabel={t('continueShopping')}
          actionHref="/"
        />
      </div>
    )
  }

  if (lines.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title={t('emptyCart')}
          description={t('emptyCartDesc')}
          actionLabel={t('continueShopping')}
          actionHref="/"
        />
      </div>
    )
  }

  async function placeOrder() {
    if (!selectedAddress) return
    setPlacing(true)
    const orderLines = lines.map(({ item }) => ({
      productId: item.productId,
      qty: item.qty,
      ...(item.variantId ? { variantId: item.variantId } : {}),
    }))
    try {
      const order = await createOrderApi({
        lines: orderLines,
        address: {
          label: selectedAddress.label,
          line1: selectedAddress.line1,
          city: selectedAddress.city,
          phone: selectedAddress.phone ?? '',
        },
        paymentMethod: payment,
      })
      clear()
      toast.success(t('toastOrderPlaced'))
      router.push(`/orders/${order.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errorTitle')
      toast.error(msg)
      setPlacing(false)
    }
  }

  const canContinue = step === 0 ? Boolean(selectedAddress) && !addressesLoading : true

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/cart" className="hover:text-primary">
          {t('cart')}
        </Link>
        <ChevronLeft className={`size-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
        <span className="text-foreground">{t('checkoutTitle')}</span>
      </nav>

      <ol className="mb-6 flex items-center gap-2" aria-label={t('checkoutTitle')}>
        {STEP_KEYS.map((key, i) => (
          <li key={key} className="flex flex-1 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                i < step
                  ? 'bg-success text-success-foreground'
                  : i === step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                i === step ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(key)}
            </span>
            {i < STEP_KEYS.length - 1 && (
              <span className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-success' : 'bg-border')} />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {step === 0 && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
                <MapPin className="size-5 text-primary" />
                {t('savedAddresses')}
              </h2>
              {addressesLoading ? (
                <ListSkeleton count={2} />
              ) : addressError ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                  <AlertCircle className="size-8 text-destructive" />
                  <p className="text-sm text-destructive">{t('errorTitle')}</p>
                  <button
                    type="button"
                    onClick={() => reloadAddresses()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    <RefreshCw className="size-4" />
                    {t('retry')}
                  </button>
                </div>
              ) : !addresses?.length ? (
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'لا توجد عناوين محفوظة.' : 'No saved addresses yet.'}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {addresses.map((a) => {
                    const active = selectedAddress?.id === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAddressId(a.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-accent',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
                            active ? 'border-primary' : 'border-muted-foreground/40',
                          )}
                        >
                          {active && <span className="size-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{a.label}</span>
                            {a.isDefault && (
                              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                                {t('defaultLabel')}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {a.line1}، {a.city}
                          </span>
                          <span className="block text-xs text-muted-foreground" dir="ltr">
                            {a.phone}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              <Link
                href="/account"
                className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-4" />
                {t('addNewAddress')}
              </Link>
            </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
                <Truck className="size-5 text-primary" />
                {t('selectSlot')}
              </h2>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(['today', 'tomorrow'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={cn(
                      'rounded-xl border p-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      day === d ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-border text-foreground hover:bg-accent',
                    )}
                  >
                    {t(d)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {(['morning', 'afternoon', 'evening'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      slot === s ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent',
                    )}
                  >
                    <span className="font-medium text-foreground tabular-nums" dir="ltr">
                      {slotLabels[s]}
                    </span>
                    <span
                      className={cn(
                        'grid size-5 place-items-center rounded-full border-2',
                        slot === s ? 'border-primary' : 'border-muted-foreground/40',
                      )}
                    >
                      {slot === s && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <>
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
                  <Wallet className="size-5 text-primary" />
                  {t('paymentMethod')}
                </h2>
                <div className="flex flex-col gap-2">
                  {([
                    { key: 'cod', icon: Wallet },
                    { key: 'card', icon: CreditCard },
                    { key: 'bank', icon: Building2 },
                  ] as const).map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPayment(key)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        payment === key ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent',
                      )}
                    >
                      <Icon className="size-5 text-primary" />
                      <span className="flex-1 font-medium text-foreground">{t(key)}</span>
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded-full border-2',
                          payment === key ? 'border-primary' : 'border-muted-foreground/40',
                        )}
                      >
                        {payment === key && <span className="size-2.5 rounded-full bg-primary" />}
                      </span>
                    </button>
                  ))}
                </div>
                {payment === 'bank' && (
                  <p className="mt-3 rounded-lg bg-accent/60 px-3 py-2 text-xs text-accent-foreground">
                    {t('bankNote')}
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-base font-bold text-foreground">{t('reviewOrder')}</h2>
                <div className="mb-3 flex flex-col gap-1 rounded-xl bg-accent/40 p-3 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <MapPin className="size-4 text-primary" />
                    {selectedAddress?.label}
                  </span>
                  <span className="text-muted-foreground">{selectedAddress?.line1}</span>
                  <span className="flex items-center gap-1.5 pt-1 font-semibold text-foreground">
                    <Truck className="size-4 text-primary" />
                    {t(day)}، {slotLabels[slot]}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {lines.map(({ item, product }) => {
                    const name = lang === 'ar' ? product.nameAr : product.nameEn
                    const unit = priceForRoleSnapshot(product, item.qty, role)
                    return (
                      <li key={item.productId} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={product.image || '/placeholder.svg'} alt={name} fill sizes="48px" className="object-cover" />
                        </span>
                        <span className="flex-1">
                          <span className="line-clamp-1 text-sm font-medium text-foreground">{name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.qty} {t('cartons')} × {formatPrice(unit)}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {formatPrice(unit * item.qty)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </>
          )}

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('back')}
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
                className="ms-auto rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t('continue')}
              </button>
            ) : (
              <button
                type="button"
                disabled={placing || !selectedAddress}
                onClick={placeOrder}
                className="ms-auto flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Check className="size-4" />
                {placing ? t('loading') : t('placeOrder')}
              </button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-bold text-foreground">{t('orderSummary')}</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('subtotal')}</dt>
                <dd className="font-semibold text-foreground">{formatPrice(totals.subtotalUsd)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('shipping')}</dt>
                <dd className="font-semibold text-foreground">
                  {totals.shippingUsd === 0 ? (
                    <span className="text-success">{t('freeShipping')}</span>
                  ) : (
                    formatPrice(totals.shippingUsd)
                  )}
                </dd>
              </div>
              <div className="my-1 border-t border-border" />
              <div className="flex items-center justify-between">
                <dt className="font-bold text-foreground">{t('total')}</dt>
                <dd className="text-xl font-black text-primary">{formatPrice(totals.totalUsd)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {lang === 'ar'
                ? 'السعر النهائي يُحسب من الخادم عند تأكيد الطلب.'
                : 'Final price is calculated server-side when you place the order.'}
            </p>
            {totals.savingsUsd > 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <TrendingDown className="size-4 shrink-0" />
                {t('save')} {formatPrice(totals.savingsUsd)} {t('savedVsMarket')}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
