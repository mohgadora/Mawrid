'use client'

import { useState } from 'react'
import { Wallet, Search, Plus, Minus } from 'lucide-react'
import { adminGetUserWalletApi, adminAdjustWalletApi, type AdminWalletData } from '@/lib/api-client'
import { useToast } from '@/lib/toast'

export default function AdminWalletsPage() {
  const toast = useToast()
  const [userId, setUserId] = useState('')
  const [data, setData] = useState<AdminWalletData | null>(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function search() {
    const id = userId.trim()
    if (!id) return
    setLoading(true)
    setData(null)
    try {
      setData(await adminGetUserWalletApi(id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر جلب المحفظة')
    } finally {
      setLoading(false)
    }
  }

  async function adjust(sign: 1 | -1) {
    const value = Number(amount) * sign
    if (!Number.isFinite(value) || value === 0) return
    setBusy(true)
    try {
      await adminAdjustWalletApi(userId.trim(), value, note.trim() || undefined)
      toast.success('تم تعديل الرصيد')
      setAmount('')
      setNote('')
      await search()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التعديل')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Wallet className="size-6 text-primary" />
        محافظ المستخدمين
      </h1>

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="معرّف المستخدم (userId)"
          dir="ltr"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !userId.trim()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          <Search className="size-4" />
          بحث
        </button>
      </div>

      {data && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
            <p className="mt-1 text-3xl font-black text-primary tabular-nums">${Number(data.wallet.balance).toFixed(2)}</p>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>الإيداعات: ${Number(data.wallet.lifetimeCredit).toFixed(2)}</span>
              <span>السحوبات: ${Number(data.wallet.lifetimeDebit).toFixed(2)}</span>
            </div>
          </div>

          {/* Adjust */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-bold text-foreground">تعديل يدوي</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="المبلغ ($)"
                dir="ltr"
                className="w-32 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة (اختياري)"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button type="button" onClick={() => adjust(1)} disabled={busy || !amount} className="flex items-center gap-1 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-success-foreground disabled:opacity-50">
                <Plus className="size-4" /> شحن
              </button>
              <button type="button" onClick={() => adjust(-1)} disabled={busy || !amount} className="flex items-center gap-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground disabled:opacity-50">
                <Minus className="size-4" /> خصم
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-bold text-foreground">آخر العمليات</h2>
            {data.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد عمليات</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-2">
                    <span className="text-foreground">{tx.type}{tx.note ? ` — ${tx.note}` : ''}</span>
                    <span className={Number(tx.amount) >= 0 ? 'font-bold text-success' : 'font-bold text-destructive'}>
                      {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}$
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
