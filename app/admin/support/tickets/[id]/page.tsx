'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Send, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/toast'

type Message = {
  id: string
  userId: string
  body: string
  isStaff: boolean
  createdAt: string
}

type Ticket = {
  id: string
  ref: string
  subject: string
  body: string
  status: string
  priority: string
  createdAt: string
  userId: string
}

type Detail = {
  ticket: Ticket
  messages: Message[]
  userMap: Record<string, string>
}

const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوح',
  in_progress: 'قيد المعالجة',
  resolved: 'محلول',
  closed: 'مغلق',
}

const PRIORITY_AR: Record<string, string> = { urgent: 'عاجل', high: 'عالي', medium: 'متوسط', low: 'منخفض' }

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { error: toastError, success: toastSuccess } = useToast()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function reload() {
    const res = await fetch(`/api/v1/admin/tickets/${id}/detail`)
    if (!res.ok) throw new Error()
    const json = await res.json()
    setDetail(json?.data ?? json)
  }

  useEffect(() => {
    setLoading(true)
    reload().catch(() => toastError('فشل تحميل التذكرة')).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const messageCount = detail?.messages.length ?? 0
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messageCount])

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/v1/admin/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply }),
      })
      if (!res.ok) throw new Error()
      setReply('')
      await reload()
    } catch {
      toastError('فشل إرسال الرد')
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status: string) {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/v1/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toastSuccess('تم تحديث الحالة')
      await reload()
    } catch {
      toastError('فشل تحديث الحالة')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">جاري التحميل…</div>
  }

  if (!detail) {
    return <div className="flex items-center justify-center py-20 text-destructive text-sm">لم يتم العثور على التذكرة</div>
  }

  const { ticket, messages, userMap } = detail

  return (
    <div className="max-w-3xl mx-auto space-y-4 route-fade">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowRight className="size-4" />
          رجوع
        </Button>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-foreground">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">{ticket.ref} · {PRIORITY_AR[ticket.priority]} · {STATUS_LABELS[ticket.status] ?? ticket.status}</p>
        </div>
        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          {ticket.status !== 'in_progress' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50" disabled={updatingStatus} onClick={() => changeStatus('in_progress')}>
              <Clock className="size-3" /> قيد المعالجة
            </Button>
          )}
          {ticket.status !== 'resolved' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-300 hover:bg-green-50" disabled={updatingStatus} onClick={() => changeStatus('resolved')}>
              <CheckCircle className="size-3" /> حل
            </Button>
          )}
          {ticket.status !== 'closed' && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5" disabled={updatingStatus} onClick={() => changeStatus('closed')}>
              <XCircle className="size-3" /> إغلاق
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.isStaff ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.isStaff ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              <p className="whitespace-pre-wrap">{msg.body}</p>
            </div>
            <p className="text-[10px] text-muted-foreground px-1">
              {msg.isStaff ? 'الإدارة' : (userMap[msg.userId] ?? 'مجهول')} · {new Date(msg.createdAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="اكتب ردك هنا…"
          className="resize-none text-sm min-h-[80px]"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply() }}
        />
        <Button className="shrink-0 gap-1.5" onClick={sendReply} disabled={sending || !reply.trim()}>
          <Send className="size-4" />
          {sending ? '…' : 'إرسال'}
        </Button>
      </div>
    </div>
  )
}
