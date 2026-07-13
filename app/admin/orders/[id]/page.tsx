'use client'

import { use, useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Pencil, ChevronRight, Save, Minus, Plus } from 'lucide-react'
import { fetchAdminOrderForEdit, editOrderQuantitiesApi, type AdminOrderEditDetail } from '@/lib/api-client'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'

export default function AdminOrderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const toast = useToast()
  const { data, isLoading, mutate } = useSWR<AdminOrderEditDetail>(['admin/order', id], () => fetchAdminOrderForEdit(id))
  const [qty, setQty] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setQty(Object.fromEntries(data.lines.map((l) => [l.id, l.qty])))
  }, [data])

  if (isLoading) return <AdminPageSkeleton />
  if (!data) return <div className="p-6 text-sm text-muted-foreground">الطلب غير موجود</div>

  const changed = data.lines.filter((l) => (qty[l.id] ?? l.qty) !== l.qty).map((l) => ({ orderLineId: l.id, newQty: qty[l.id] ?? l.qty }))
  const newSubtotal = data.lines.reduce((s, l) => s + l.unitPrice * (qty[l.id] ?? l.qty), 0)
  const priceDiff = newSubtotal - data.subtotal

  async function apply() {
    if (!changed.length || busy) return
    setBusy(true)
    try {
      const res = await editOrderQuantitiesApi(id, changed)
      toast.success(res.settlement === 'return' ? `تم التعديل — مرتجع ${Math.abs(res.priceDiff).toFixed(2)}$` : res.settlement === 'due' ? `تم التعديل — مستحق ${res.priceDiff.toFixed(2)}$` : 'تم التعديل')
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر التعديل')
    } finally {
      setBusy(false)
    }
  }

  function setQ(lineId: string, v: number) {
    setQty((prev) => ({ ...prev, [lineId]: Math.max(0, v) }))
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-primary">الطلبات</Link>
        <ChevronRight className="size-4 rotate-180" />
        <span className="text-foreground" dir="ltr">{data.ref}</span>
      </nav>

      <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Pencil className="size-6 text-primary" /> تعديل الطلب
      </h1>

      {!data.editable && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700">
          لا يمكن تعديل هذا الطلب في حالته الحالية ({data.status}).
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <ul className="divide-y divide-border">
          {data.lines.map((l) => {
            const q = qty[l.id] ?? l.qty
            return (
              <li key={l.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{l.productName}</span>
                  <span className="text-xs text-muted-foreground">${l.unitPrice.toFixed(2)} / وحدة</span>
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={!data.editable} onClick={() => setQ(l.id, q - 1)} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-40"><Minus className="size-4" /></button>
                  <input type="number" value={q} disabled={!data.editable} onChange={(e) => setQ(l.id, Math.trunc(Number(e.target.value) || 0))} className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm" dir="ltr" />
                  <button type="button" disabled={!data.editable} onClick={() => setQ(l.id, q + 1)} className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-40"><Plus className="size-4" /></button>
                </div>
                <span className="w-20 text-end text-sm font-bold text-foreground">${(l.unitPrice * q).toFixed(2)}</span>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <div className="text-muted-foreground">
            المجموع الجديد: <span className="font-bold text-foreground">${newSubtotal.toFixed(2)}</span>
            {priceDiff !== 0 && (
              <span className={priceDiff > 0 ? 'ms-2 font-bold text-destructive' : 'ms-2 font-bold text-success'}>
                ({priceDiff > 0 ? 'مستحق' : 'مرتجع'} ${Math.abs(priceDiff).toFixed(2)})
              </span>
            )}
          </div>
          <button type="button" onClick={apply} disabled={busy || !changed.length || !data.editable} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Save className="size-4" /> تطبيق التعديل
          </button>
        </div>
      </div>

      {data.edits.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-base font-bold text-foreground">سجل التعديلات</h2>
          <ul className="divide-y divide-border text-sm">
            {data.edits.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{e.editType} · {new Date(e.createdAt).toLocaleString('ar')}</span>
                <span className={Number(e.priceDiff) >= 0 ? 'font-bold text-destructive' : 'font-bold text-success'}>{Number(e.priceDiff) >= 0 ? '+' : ''}{Number(e.priceDiff).toFixed(2)}$</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
