'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAdminRefundsApi,
  approveRefundApi,
  rejectRefundApi,
  processRefundApi,
  type AdminRefundRow,
} from '@/lib/api-client'

const STATUS_TABS = [
  { key: '', label: 'الكل' },
  { key: 'pending', label: 'معلّق' },
  { key: 'approved', label: 'موافق' },
  { key: 'rejected', label: 'مرفوض' },
  { key: 'processed', label: 'محوّل' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'معلّق',   color: 'bg-yellow-100 text-yellow-800' },
  approved:  { label: 'موافق',   color: 'bg-green-100 text-green-800' },
  rejected:  { label: 'مرفوض',  color: 'bg-red-100 text-red-800' },
  processed: { label: 'محوّل',  color: 'bg-blue-100 text-blue-800' },
  refunded:  { label: 'مسترجع', color: 'bg-purple-100 text-purple-800' },
  cancelled: { label: 'ملغى',   color: 'bg-gray-100 text-gray-700' },
}

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function truncate(str: string | null | undefined, n = 12) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('ar-SA', { dateStyle: 'short' })
}

export default function AdminRefundsPage() {
  const [tab, setTab]             = useState('')
  const [rows, setRows]           = useState<AdminRefundRow[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // reject dialog
  const [rejectId, setRejectId]   = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminRefundsApi(tab || undefined)
      setRows(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { void load() }, [load])

  async function handleApprove(id: string) {
    setBusy(true)
    try {
      await approveRefundApi(id)
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleProcess(id: string) {
    setBusy(true)
    try {
      await processRefundApi(id)
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRejectSubmit() {
    if (!rejectId || !rejectReason.trim()) return
    setBusy(true)
    try {
      await rejectRefundApi(rejectId, rejectReason.trim())
      setRejectId(null)
      setRejectReason('')
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">طلبات الاسترداد</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">جاري التحميل…</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-gray-400">لا توجد طلبات</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">العميل</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">رقم الطلب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">السبب</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">المبلغ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.userName}</div>
                    <div className="text-xs text-gray-400">{row.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{truncate(row.orderRef ?? row.orderId, 14)}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{row.reason}</td>
                  <td className="px-4 py-3">
                    {row.refundAmount != null
                      ? `${Number(row.refundAmount).toLocaleString('ar-SA')} ر.س`
                      : row.orderTotal != null
                        ? `${Number(row.orderTotal).toLocaleString('ar-SA')} ر.س`
                        : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.status === 'pending' && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => handleApprove(row.id)}
                            className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            موافقة
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => { setRejectId(row.id); setRejectReason('') }}
                            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      {row.status === 'approved' && (
                        <button
                          disabled={busy}
                          onClick={() => handleProcess(row.id)}
                          className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          تحويل الاسترداد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject dialog */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" dir="rtl">
            <h2 className="mb-4 text-lg font-semibold">سبب الرفض</h2>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={4}
              placeholder="أدخل سبب الرفض…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setRejectId(null); setRejectReason('') }}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                إلغاء
              </button>
              <button
                disabled={busy || !rejectReason.trim()}
                onClick={handleRejectSubmit}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
