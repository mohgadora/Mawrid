'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import {
  fetchWallet,
  fetchWalletTransactions,
  topupWalletApi,
  type WalletSummary,
  type WalletTx,
} from '@/lib/api-client'
import { ListSkeleton } from '@/components/skeletons'
import { cn } from '@/lib/utils'

const CREDIT_TYPES = new Set(['topup', 'refund', 'bonus', 'loyalty_convert', 'cashback', 'admin_credit'])

function txLabel(type: string, lang: string): string {
  const ar: Record<string, string> = {
    topup: 'شحن المحفظة', purchase: 'دفع طلب', refund: 'استرجاع', bonus: 'بونص',
    loyalty_convert: 'تحويل نقاط', cashback: 'استرجاع نقدي', admin_credit: 'إضافة إدارية', admin_debit: 'خصم إداري',
  }
  const en: Record<string, string> = {
    topup: 'Top-up', purchase: 'Order payment', refund: 'Refund', bonus: 'Bonus',
    loyalty_convert: 'Points convert', cashback: 'Cashback', admin_credit: 'Admin credit', admin_debit: 'Admin debit',
  }
  return (lang === 'ar' ? ar : en)[type] ?? type
}

export function WalletView() {
  const { lang, formatPrice } = useI18n()
  const toast = useToast()
  const [topupOpen, setTopupOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const walletSWR = useSWR<WalletSummary>('wallet', fetchWallet)
  const txSWR = useSWR('wallet/transactions', () => fetchWalletTransactions(1))

  async function submitTopup() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    setBusy(true)
    try {
      const res = await topupWalletApi(value)
      toast.success(
        res.bonus > 0
          ? lang === 'ar' ? `تم الشحن + بونص ${formatPrice(res.bonus)}` : `Topped up + ${formatPrice(res.bonus)} bonus`
          : lang === 'ar' ? 'تم شحن المحفظة' : 'Wallet topped up',
      )
      setTopupOpen(false)
      setAmount('')
      walletSWR.mutate()
      txSWR.mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : lang === 'ar' ? 'تعذّر الشحن' : 'Top-up failed')
    } finally {
      setBusy(false)
    }
  }

  const w = walletSWR.data
  const txns: WalletTx[] = txSWR.data?.items ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
        <WalletIcon className="size-6 text-primary" />
        {lang === 'ar' ? 'محفظتي' : 'My Wallet'}
      </h1>

      {/* Balance card */}
      {walletSWR.isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      ) : walletSWR.error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <button
            type="button"
            onClick={() => walletSWR.mutate()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <RefreshCw className="size-4" />
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground">
          <WalletIcon className="absolute end-4 top-4 size-20 opacity-15" />
          <p className="text-sm opacity-80">{lang === 'ar' ? 'الرصيد الحالي' : 'Current balance'}</p>
          <p className="mt-1 text-4xl font-black">{formatPrice(w?.balance ?? 0)}</p>
          <div className="mt-4 flex gap-4 text-xs opacity-90">
            <span>{lang === 'ar' ? 'إجمالي الإيداعات' : 'Total in'}: {formatPrice(w?.lifetimeCredit ?? 0)}</span>
            <span>{lang === 'ar' ? 'إجمالي السحوبات' : 'Total out'}: {formatPrice(w?.lifetimeDebit ?? 0)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTopupOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary-foreground px-5 py-2.5 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
          >
            <Plus className="size-4" />
            {lang === 'ar' ? 'شحن المحفظة' : 'Top up'}
          </button>
        </div>
      )}

      {/* Transactions */}
      <h2 className="mb-3 mt-6 text-base font-bold text-foreground">
        {lang === 'ar' ? 'آخر العمليات' : 'Recent activity'}
      </h2>
      {txSWR.isLoading ? (
        <ListSkeleton count={4} />
      ) : txns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {lang === 'ar' ? 'لا توجد عمليات بعد' : 'No transactions yet'}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {txns.map((tx) => {
            const isCredit = CREDIT_TYPES.has(tx.type)
            const amt = Number(tx.amount)
            const Icon = tx.type === 'bonus' ? Gift : isCredit ? ArrowDownLeft : ArrowUpRight
            return (
              <li key={tx.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', isCredit ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive')}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-foreground">{txLabel(tx.type, lang)}</span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">
                    {new Date(tx.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                  </span>
                </span>
                <span className={cn('text-sm font-black tabular-nums', isCredit ? 'text-success' : 'text-destructive')}>
                  {isCredit ? '+' : '−'} {formatPrice(Math.abs(amt))}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Top-up dialog */}
      {topupOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && setTopupOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{lang === 'ar' ? 'شحن المحفظة' : 'Top up wallet'}</h3>
              <button type="button" onClick={() => !busy && setTopupOpen(false)} aria-label="close" className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={lang === 'ar' ? 'المبلغ بالدولار' : 'Amount (USD)'}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              dir="ltr"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent"
                >
                  {formatPrice(v)}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={busy || !amount || Number(amount) <= 0}
              onClick={submitTopup}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy ? (lang === 'ar' ? 'جارٍ...' : 'Processing...') : lang === 'ar' ? 'تأكيد الشحن' : 'Confirm top-up'}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {lang === 'ar'
                ? 'تجريبي — في الإنتاج يمرّ الشحن عبر بوابة دفع.'
                : 'Demo — production top-ups go through a payment gateway.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
