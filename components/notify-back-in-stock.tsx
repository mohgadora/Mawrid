'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type State = 'idle' | 'open' | 'loading' | 'done'

export function NotifyBackInStock({ productId }: { productId: string }) {
  const { lang } = useI18n()
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function open() {
    setState('open')
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError(lang === 'ar' ? 'أدخل بريدًا إلكترونيًا صحيحًا' : 'Enter a valid email address')
      return
    }
    setState('loading')
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900))
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        <Check className="size-4 shrink-0" />
        {lang === 'ar'
          ? 'سنُخطرك فور توفّر المنتج!'
          : "We'll notify you when it's back in stock!"}
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <button
        onClick={open}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-4" />
        {lang === 'ar' ? 'أخبرني عند التوفّر' : 'Notify me when available'}
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border bg-accent/40 px-4 py-2.5">
        <Bell className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          {lang === 'ar' ? 'إشعار عند التوفّر' : 'Back in stock alert'}
        </p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="ms-auto text-muted-foreground hover:text-foreground focus-visible:outline-none"
          aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        >
          <BellOff className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {lang === 'ar'
            ? 'أدخل بريدك الإلكتروني وسنُعلمك فور عودة المنتج للمخزون.'
            : 'Enter your email and we\'ll alert you as soon as this product is restocked.'}
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder={lang === 'ar' ? 'بريدك الإلكتروني' : 'Your email address'}
            className={cn(
              'flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
              error ? 'border-destructive' : 'border-border',
            )}
            dir="ltr"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {state === 'loading' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              lang === 'ar' ? 'تنبيه' : 'Alert me'
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    </form>
  )
}
