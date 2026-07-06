'use client'

import { use, useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { AsyncContent } from '@/components/async-content'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low'

interface TicketMessage {
  id: string
  body: string
  authorRole: 'partner' | 'staff'
  createdAt: string
}

interface TicketDetail {
  id: string
  ref: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  messages: TicketMessage[]
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

const fetchTicket = (id: string) => apiFetch<TicketDetail>(`partner/support/tickets/${id}`)

const sendMessage = (id: string, body: string) =>
  apiFetch(`partner/support/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) })

const closeTicket = (id: string) =>
  apiFetch(`partner/support/tickets/${id}/close`, { method: 'PATCH' })

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerSupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, error, isLoading, mutate } = useSWR(`partner/support/tickets/${id}`, () => fetchTicket(id))

  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [closing, setClosing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages])

  async function handleSend() {
    if (!replyText.trim()) return
    setSending(true)
    setSendError('')
    try {
      await sendMessage(id, replyText.trim())
      setReplyText('')
      await mutate()
    } catch {
      setSendError('تعذّر إرسال الرسالة، حاول مرة أخرى.')
    } finally {
      setSending(false)
    }
  }

  async function handleClose() {
    setClosing(true)
    try {
      await closeTicket(id)
      await mutate()
    } finally {
      setClosing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Link href="/partner/support" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4 rtl:rotate-180" /> العودة إلى التذاكر
      </Link>

      <AsyncContent data={data} error={error} isLoading={isLoading} onRetry={() => mutate()}>
        {(ticket) => (
          <div className="space-y-4">
            {/* Ticket header */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold leading-snug">{ticket.subject}</h2>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{ticket.ref}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', priorityClass[ticket.priority])}>
                    {priorityLabel[ticket.priority]}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusClass[ticket.status])}>
                    {statusLabel[ticket.status]}
                  </span>
                  {ticket.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                      disabled={closing}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {closing ? 'جاري الإغلاق...' : 'إغلاق التذكرة'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Message thread */}
            <div className="rounded-xl border border-border bg-card">
              <div className="max-h-[480px] overflow-y-auto p-4 space-y-3">
                {ticket.messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">لا توجد رسائل بعد</p>
                )}
                {ticket.messages.map((msg) => {
                  const isStaff = msg.authorRole === 'staff'
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isStaff ? 'justify-start' : 'justify-end')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-xl px-4 py-2.5 text-sm',
                          isStaff
                            ? 'bg-blue-600 text-white rounded-tl-none'
                            : 'bg-muted text-foreground rounded-tr-none',
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        <p className={cn('mt-1 text-[10px]', isStaff ? 'text-blue-200' : 'text-muted-foreground')}>
                          {new Date(msg.createdAt).toLocaleString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {ticket.status !== 'closed' && (
                <div className="border-t border-border p-4 space-y-2">
                  {sendError && <p className="text-xs text-red-500">{sendError}</p>}
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      placeholder="اكتب ردّك هنا... (Ctrl+Enter للإرسال)"
                      disabled={sending}
                      className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={sending || !replyText.trim()}
                      className="h-10 gap-1.5 shrink-0"
                    >
                      <Send className="size-3.5" />
                      {sending ? 'إرسال...' : 'إرسال'}
                    </Button>
                  </div>
                </div>
              )}

              {ticket.status === 'closed' && (
                <div className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
                  هذه التذكرة مغلقة ولا يمكن إضافة ردود جديدة
                </div>
              )}
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
