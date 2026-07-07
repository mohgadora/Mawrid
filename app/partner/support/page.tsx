'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Eye, Plus, X } from 'lucide-react'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low'

interface SupportTicket {
  id: string
  ref: string
  subject: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return (json.data ?? json) as T
}

const fetchTickets = () => apiFetch<SupportTicket[]>('partner/support/tickets')

async function createTicket(body: {
  subject: string
  category: string
  priority: TicketPriority
  message: string
}) {
  return apiFetch('partner/support/tickets', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Label maps ──────────────────────────────────────────────────────────────

const statusLabel: Record<TicketStatus, string> = {
  open: 'مفتوح',
  in_progress: 'قيد المعالجة',
  resolved: 'محلول',
  closed: 'مغلق',
}

const statusClass: Record<TicketStatus, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

const priorityLabel: Record<TicketPriority, string> = {
  urgent: 'عاجل جداً',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
}

const priorityClass: Record<TicketPriority, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

// ─── New ticket dialog ────────────────────────────────────────────────────────

function NewTicketDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('orders')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createTicket({ subject: subject.trim(), category, priority, message: message.trim() })
      onCreated()
      onClose()
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">فتح تذكرة جديدة</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموضوع <span className="text-red-500">*</span></label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="اكتب موضوع التذكرة"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="orders">الطلبات</option>
                <option value="payments">المدفوعات</option>
                <option value="products">المنتجات</option>
                <option value="shipping">الشحن</option>
                <option value="account">الحساب</option>
                <option value="technical">الدعم التقني</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="urgent">عاجل جداً</option>
                <option value="high">عالي</option>
                <option value="medium">متوسط</option>
                <option value="low">منخفض</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الرسالة <span className="text-red-500">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="اشرح مشكلتك بالتفصيل..."
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>إلغاء</Button>
            <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()}>
              {submitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerSupportPage() {
  const { data, error, isLoading, mutate } = useSWR('partner/support/tickets', fetchTickets)
  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">تذاكر الدعم</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setShowDialog(true)}>
          <Plus className="size-4" /> فتح تذكرة جديدة
        </Button>
      </div>

      <AsyncContent data={data} error={error} isLoading={isLoading} loading={<AdminPageSkeleton rows={6} cards={0} />} onRetry={() => mutate()}>
        {(tickets) => (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">رقم المرجع</th>
                  <th className="px-4 py-3 text-start font-medium">الموضوع</th>
                  <th className="px-4 py-3 text-start font-medium">الأولوية</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-start font-medium">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => window.location.href = `/partner/support/${ticket.id}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{ticket.ref}</td>
                    <td className="px-4 py-3 text-xs font-medium max-w-[200px] truncate">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', priorityClass[ticket.priority])}>
                        {priorityLabel[ticket.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusClass[ticket.status])}>
                        {statusLabel[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/partner/support/${ticket.id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 gap-1 text-xs')}
                      >
                        <Eye className="size-3.5" /> فتح
                      </Link>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      لا توجد تذاكر دعم حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AsyncContent>

      {showDialog && (
        <NewTicketDialog
          onClose={() => setShowDialog(false)}
          onCreated={() => mutate()}
        />
      )}
    </div>
  )
}
