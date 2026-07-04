'use client'

import { Star, Gift, TrendingUp, ShoppingCart, UserPlus, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type PointTx = {
  id: string
  icon: typeof Star
  labelAr: string
  labelEn: string
  points: number
  date: string
}

const TRANSACTIONS: PointTx[] = [
  { id: '1', icon: ShoppingCart, labelAr: 'شراء أرز 10 كراتين', labelEn: 'Purchased rice 10 cartons', points: +120, date: '2024-06-28' },
  { id: '2', icon: UserPlus, labelAr: 'إحالة زميل', labelEn: 'Referral reward', points: +200, date: '2024-06-20' },
  { id: '3', icon: Gift, labelAr: 'استرداد قسيمة', labelEn: 'Voucher redeemed', points: -150, date: '2024-06-10' },
  { id: '4', icon: ShoppingCart, labelAr: 'شراء زيت طعام 5 كراتين', labelEn: 'Purchased cooking oil 5 cartons', points: +60, date: '2024-06-01' },
  { id: '5', icon: Package, labelAr: 'مكافأة الطلب المكتمل', labelEn: 'Completed order bonus', points: +50, date: '2024-05-25' },
]

const BALANCE = 1340
const NEXT_TIER = 2000
const CURRENT_TIER = 'Silver'
const NEXT_TIER_LABEL = 'Gold'

const REWARDS = [
  { id: '1', cost: 500, labelAr: 'قسيمة 10 ريال', labelEn: 'SAR 10 voucher', icon: Gift },
  { id: '2', cost: 1000, labelAr: 'قسيمة 25 ريال', labelEn: 'SAR 25 voucher', icon: Gift },
  { id: '3', cost: 2500, labelAr: 'شحن مجاني لـ 3 طلبات', labelEn: 'Free shipping x3 orders', icon: Package },
]

export function LoyaltySection() {
  const { lang } = useI18n()
  const pct = Math.min((BALANCE / NEXT_TIER) * 100, 100)

  return (
    <div className="flex flex-col gap-4">
      {/* Balance card */}
      <div className="overflow-hidden rounded-2xl border border-chart-3/30 bg-chart-3/5 p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-chart-3/20 text-chart-3">
            <Star className="size-7 fill-current" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? 'رصيد النقاط' : 'Points balance'}
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground">
              {BALANCE.toLocaleString()}
              <span className="ms-1.5 text-base font-semibold text-muted-foreground">
                {lang === 'ar' ? 'نقطة' : 'pts'}
              </span>
            </p>
            <p className="mt-0.5 text-sm font-semibold text-chart-3">
              {lang === 'ar' ? `عضوية ${CURRENT_TIER}` : `${CURRENT_TIER} member`}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{lang === 'ar' ? `نحو ${NEXT_TIER_LABEL}` : `Towards ${NEXT_TIER_LABEL}`}</span>
            <span dir="ltr">{BALANCE} / {NEXT_TIER}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-chart-3 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {lang === 'ar'
              ? `${(NEXT_TIER - BALANCE).toLocaleString()} نقطة تفصلك عن ${NEXT_TIER_LABEL}`
              : `${(NEXT_TIER - BALANCE).toLocaleString()} pts to reach ${NEXT_TIER_LABEL}`}
          </p>
        </div>
      </div>

      {/* Redeem rewards */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          <Gift className="size-4" />
          {lang === 'ar' ? 'استبدال النقاط' : 'Redeem rewards'}
        </h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {REWARDS.map((r) => {
            const canRedeem = BALANCE >= r.cost
            return (
              <div
                key={r.id}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                  canRedeem ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-chart-3/15 text-chart-3">
                  <r.icon className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {lang === 'ar' ? r.labelAr : r.labelEn}
                </p>
                <button
                  disabled={!canRedeem}
                  className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star className="size-3" />
                  {r.cost.toLocaleString()} {lang === 'ar' ? 'نقطة' : 'pts'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          <TrendingUp className="size-4" />
          {lang === 'ar' ? 'سجل النقاط' : 'Points history'}
        </h4>
        <ul className="flex flex-col gap-0">
          {TRANSACTIONS.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <tx.icon className="size-4" />
              </span>
              <span className="flex-1 text-sm text-foreground">
                {lang === 'ar' ? tx.labelAr : tx.labelEn}
              </span>
              <span className={`text-sm font-black tabular-nums ${tx.points > 0 ? 'text-success' : 'text-destructive'}`}>
                {tx.points > 0 ? '+' : ''}{tx.points}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
