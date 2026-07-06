'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  from: 'user' | 'bot'
  text: string
  time: string
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const BOT_REPLIES_AR = [
  'شكراً على تواصلك! سيرد أحد ممثلي الدعم عليك قريباً.',
  'تم استلام رسالتك. متوسط وقت الرد 5 دقائق.',
  'يسعدنا مساعدتك! للاستفسار السريع يمكنك الاطلاع على مركز المساعدة.',
  'فريق الدعم لدينا متاح من 8 ص إلى 10 م.',
]

const BOT_REPLIES_EN = [
  'Thanks for reaching out! A support agent will reply shortly.',
  'Your message was received. Average response time is 5 minutes.',
  "We're happy to help! For quick answers check our Help Center.",
  'Our support team is available from 8 AM to 10 PM.',
]

export function LiveChat() {
  const { lang } = useI18n()
  const replyIdxRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      from: 'bot',
      text: lang === 'ar'
        ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟'
        : 'Hello! How can I help you today?',
      time: now(),
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, minimized, messages])

  useEffect(() => () => { if (botTimerRef.current) clearTimeout(botTimerRef.current) }, [])

  function send() {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: input.trim(), time: now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Simulate bot reply
    const replies = lang === 'ar' ? BOT_REPLIES_AR : BOT_REPLIES_EN
    const reply = replies[replyIdxRef.current % replies.length]
    replyIdxRef.current++

    if (botTimerRef.current) clearTimeout(botTimerRef.current)
    botTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: 'bot', text: reply, time: now() },
      ])
    }, 900)
  }

  const unread = !open ? messages.filter((m) => m.from === 'bot').length : 0

  return (
    <div
      className="fixed bottom-20 end-4 z-50 flex flex-col items-end gap-3 lg:bottom-6"
      role="region"
      aria-label={lang === 'ar' ? 'الدعم المباشر' : 'Live support'}
    >
      {/* Chat window */}
      {open && (
        <div
          className={cn(
            'flex w-80 flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl transition-all sm:w-96',
            minimized ? 'h-14' : 'h-[420px]',
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <span className="relative grid size-8 place-items-center rounded-full bg-primary-foreground/20">
              <Bot className="size-4" />
              <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-primary bg-success" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">
                {lang === 'ar' ? 'الدعم الفوري' : 'Live Support'}
              </p>
              <p className="text-xs opacity-80">
                {lang === 'ar' ? 'عادةً يرد خلال دقائق' : 'Usually replies in minutes'}
              </p>
            </div>
            <button
              onClick={() => setMinimized((m) => !m)}
              aria-label={minimized ? 'Expand' : 'Minimize'}
              className="grid size-7 place-items-center rounded-lg opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            >
              <Minimize2 className="size-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              className="grid size-7 place-items-center rounded-lg opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          {!minimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-end gap-2',
                      msg.from === 'user' ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    <span className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                      msg.from === 'bot' ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground',
                    )}>
                      {msg.from === 'bot' ? <Bot className="size-4" /> : <User className="size-4" />}
                    </span>
                    <div
                      className={cn(
                        'max-w-[72%] rounded-2xl px-3 py-2 text-sm',
                        msg.from === 'user'
                          ? 'rounded-ee-sm bg-primary text-primary-foreground'
                          : 'rounded-es-sm bg-muted text-foreground',
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className={cn(
                        'mt-0.5 text-[10px] opacity-60',
                        msg.from === 'user' ? 'text-end' : 'text-start',
                      )}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) send()
                    }}
                    placeholder={lang === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    aria-label={lang === 'ar' ? 'إرسال' : 'Send'}
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-transform hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Send className={cn('size-4', lang === 'ar' ? 'rotate-180' : '')} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => {
          setOpen((o) => !o)
          setMinimized(false)
        }}
        aria-label={lang === 'ar' ? 'فتح الدعم المباشر' : 'Open live support'}
        className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
