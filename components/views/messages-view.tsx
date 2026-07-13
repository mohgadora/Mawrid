'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Send, ChevronLeft, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { authClient } from '@/lib/auth-client'
import {
  fetchConversations,
  fetchMessages,
  sendMessageApi,
  markConversationReadApi,
  type ChatConversation,
  type ChatMessageItem,
} from '@/lib/api-client'
import { cn } from '@/lib/utils'

function TypeLabel({ type, lang }: { type: string; lang: string }) {
  const ar: Record<string, string> = { buyer_supplier: 'المورد', buyer_admin: 'الدعم', buyer_driver: 'السائق' }
  const en: Record<string, string> = { buyer_supplier: 'Supplier', buyer_admin: 'Support', buyer_driver: 'Driver' }
  return <>{(lang === 'ar' ? ar : en)[type] ?? type}</>
}

export function MessagesView() {
  const { lang, dir } = useI18n()
  const { data: session } = authClient.useSession()
  const myId = session?.user?.id
  const searchParams = useSearchParams()
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('c'))

  const convSWR = useSWR<ChatConversation[]>('conversations', () => fetchConversations(1), {
    refreshInterval: 5000,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
        <MessageSquare className="size-6 text-primary" />
        {lang === 'ar' ? 'الرسائل' : 'Messages'}
      </h1>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside className={cn('rounded-2xl border border-border bg-card', activeId && 'hidden md:block')}>
          {convSWR.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">{lang === 'ar' ? 'جارٍ...' : 'Loading...'}</div>
          ) : !convSWR.data?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {lang === 'ar' ? 'لا توجد محادثات' : 'No conversations'}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {convSWR.data.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-accent',
                      activeId === c.id && 'bg-accent',
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary">
                      {c.otherName?.[0] ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-foreground">{c.otherName}</span>
                        {c.unread > 0 && (
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {c.unread}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.lastMessage ?? <TypeLabel type={c.type} lang={lang} />}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat window */}
        <section className={cn('rounded-2xl border border-border bg-card', !activeId && 'hidden md:flex md:items-center md:justify-center')}>
          {activeId ? (
            <ChatWindow
              conversationId={activeId}
              myId={myId}
              onBack={() => setActiveId(null)}
              onSent={() => convSWR.mutate()}
              dir={dir}
              lang={lang}
            />
          ) : (
            <p className="p-8 text-sm text-muted-foreground">
              {lang === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function ChatWindow({
  conversationId,
  myId,
  onBack,
  onSent,
  dir,
  lang,
}: {
  conversationId: string
  myId?: string
  onBack: () => void
  onSent: () => void
  dir: string
  lang: string
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const msgSWR = useSWR(['messages', conversationId], () => fetchMessages(conversationId), {
    refreshInterval: 5000,
  })
  const messages: ChatMessageItem[] = msgSWR.data?.items ?? []

  // mark read + scroll on new messages
  useEffect(() => {
    if (messages.length) {
      markConversationReadApi(conversationId).catch(() => {})
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversationId])

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessageApi(conversationId, body)
      await msgSWR.mutate()
      onSent()
    } catch {
      setText(body)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[70vh] w-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <button type="button" onClick={onBack} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden">
          {dir === 'rtl' ? <ChevronLeft className="size-5 rotate-180" /> : <ArrowLeft className="size-5" />}
        </button>
        <span className="text-sm font-bold text-foreground">{lang === 'ar' ? 'المحادثة' : 'Conversation'}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => {
          const mine = m.senderId === myId
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                mine ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground',
              )}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')} dir="ltr">
                  {new Date(m.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          aria-label={lang === 'ar' ? 'إرسال' : 'Send'}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className={cn('size-4', dir === 'rtl' && 'scale-x-[-1]')} />
        </button>
      </div>
    </div>
  )
}
