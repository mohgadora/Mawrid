'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Star, ThumbsUp, BadgeCheck, MessageSquare, PenLine, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  fetchProductReviews,
  submitReviewApi,
  toggleReviewHelpfulApi,
  submitReviewReplyApi,
  type ProductReviewSummary,
} from '@/lib/api-client'

// ─── helpers ────────────────────────────────────────────────────────────────

function StarRow({ filled, total = 5, size = 'sm' }: { filled: number; total?: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <span className="flex items-center gap-0.5" aria-label={`${filled} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Star key={i} className={cn(cls, i < filled ? 'fill-chart-3 text-chart-3' : 'fill-muted text-muted')} />
      ))}
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="focus-visible:outline-none"
          aria-label={`${s} نجوم`}
        >
          <Star className={cn('size-6 transition-colors', (hover || value) >= s ? 'fill-chart-3 text-chart-3' : 'fill-muted text-muted')} />
        </button>
      ))}
    </span>
  )
}

// ─── Write Review Form ───────────────────────────────────────────────────────

function WriteReviewForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { lang } = useI18n()
  const { success, error: toastError } = useToast()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toastError(lang === 'ar' ? 'اختر تقييماً' : 'Please select a rating'); return }
    if (body.trim().length < 10) { toastError(lang === 'ar' ? 'الرأي قصير جداً (10 أحرف على الأقل)' : 'Review too short'); return }
    setLoading(true)
    try {
      await submitReviewApi(productId, { rating, title: title.trim() || undefined, body: body.trim() })
      success(lang === 'ar' ? 'تم إرسال تقييمك بنجاح' : 'Review submitted!')
      onDone()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      toastError(msg.includes('409') || msg.includes('سابقاً')
        ? (lang === 'ar' ? 'لقد قيّمت هذا المنتج سابقاً' : 'Already reviewed')
        : (lang === 'ar' ? 'فشل الإرسال' : 'Submission failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-accent/30 p-4 space-y-3 mt-4">
      <p className="text-sm font-semibold text-foreground">{lang === 'ar' ? 'أضف تقييمك' : 'Write a review'}</p>

      <div className="flex items-center gap-3">
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && <span className="text-xs text-muted-foreground">{['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][rating]}</span>}
      </div>

      <input
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={lang === 'ar' ? 'عنوان مختصر (اختياري)' : 'Short title (optional)'}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
      <textarea
        required
        rows={3}
        minLength={10}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={lang === 'ar' ? 'شاركنا رأيك في المنتج…' : 'Share your thoughts on this product…'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? '…' : (lang === 'ar' ? 'إرسال' : 'Submit')}
        </button>
      </div>
    </form>
  )
}

// ─── Reply Form ──────────────────────────────────────────────────────────────

function ReplyForm({ productId, reviewId, onDone }: { productId: string; reviewId: string; onDone: () => void }) {
  const { lang } = useI18n()
  const { success, error: toastError } = useToast()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length < 5) return
    setLoading(true)
    try {
      await submitReviewReplyApi(productId, reviewId, body.trim())
      success(lang === 'ar' ? 'تم إرسال ردّك' : 'Reply sent')
      onDone()
    } catch (err) {
      console.error('[ProductReviews] reply submit failed', err)
      toastError(lang === 'ar' ? 'فشل الإرسال' : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <input
        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={lang === 'ar' ? 'ردّك على هذا التقييم…' : 'Your reply…'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
      />
      <button
        type="submit"
        disabled={loading || body.trim().length < 5}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? '…' : (lang === 'ar' ? 'إرسال' : 'Send')}
      </button>
      <button type="button" onClick={onDone} className="text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </form>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ProductReviews({ productId }: { productId: string }) {
  const { lang } = useI18n()
  const { data: session } = authClient.useSession()
  const { data, mutate, isLoading } = useSWR(
    `reviews/${productId}`,
    () => fetchProductReviews(productId),
    { revalidateOnFocus: false },
  )

  const [showForm, setShowForm]         = useState(false)
  const [replyingTo, setReplyingTo]     = useState<string | null>(null)
  const [expandedReplies, setExpanded]  = useState<Set<string>>(new Set())
  const [optimisticHelp, setOptimistic] = useState<Record<string, boolean>>({})

  const isLoggedIn = !!session?.user
  const isSupplier = session?.user?.role === 'supplier' || session?.user?.role === 'admin'

  async function handleHelpful(reviewId: string) {
    if (!isLoggedIn) return
    const current = optimisticHelp[reviewId] ?? (data?.userHelpfulIds.includes(reviewId) ?? false)
    setOptimistic((p) => ({ ...p, [reviewId]: !current }))
    try {
      await toggleReviewHelpfulApi(productId, reviewId)
      await mutate()
    } catch (err) {
      console.error('[ProductReviews] toggleHelpful failed', err)
      setOptimistic((p) => ({ ...p, [reviewId]: current }))
    }
  }

  function toggleReplies(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-20 rounded bg-muted" />
      </section>
    )
  }

  const summary = data
  const reviews  = summary?.reviews ?? []
  const dist     = summary?.distribution ?? [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: 0, pct: 0 }))
  const avg      = summary?.averageRating ?? 0
  const total    = summary?.totalCount ?? 0

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">
          {lang === 'ar' ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}
          {total > 0 && (
            <span className="ms-2 text-sm font-normal text-muted-foreground">({total})</span>
          )}
        </h2>
        {isLoggedIn && !isSupplier && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <PenLine className="size-3.5" />
            {lang === 'ar' ? 'أضف تقييمك' : 'Write a review'}
          </button>
        )}
      </div>

      {/* Write form */}
      {showForm && (
        <WriteReviewForm
          productId={productId}
          onDone={() => { setShowForm(false); mutate() }}
        />
      )}

      {/* Summary */}
      {total > 0 && (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-accent/50 px-8 py-4 sm:shrink-0">
            <span className="text-5xl font-black tabular-nums text-foreground">{avg}</span>
            <StarRow filled={Math.round(avg)} />
            <span className="mt-1 text-xs text-muted-foreground">
              {total.toLocaleString(lang === 'ar' ? 'ar' : 'en-US')}{' '}
              {lang === 'ar' ? 'تقييم' : 'reviews'}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            {dist.map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-4 shrink-0 text-end text-muted-foreground tabular-nums">{stars}</span>
                <Star className="size-3 shrink-0 fill-chart-3 text-chart-3" />
                <div className="flex-1 overflow-hidden rounded-full bg-border">
                  <div className="h-1.5 rounded-full bg-chart-3 transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-7 shrink-0 text-muted-foreground tabular-nums">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {lang === 'ar' ? 'لا توجد مراجعات بعد. كن أول من يقيّم هذا المنتج!' : 'No reviews yet. Be the first!'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {reviews.map((r) => {
            const isHelpful   = optimisticHelp[r.id] ?? (data?.userHelpfulIds.includes(r.id) ?? false)
            const helpfulCount = r.helpfulCount + ((optimisticHelp[r.id] !== undefined
              ? (optimisticHelp[r.id] ? 1 : -1)
              : 0))
            const showReplies = expandedReplies.has(r.id)

            return (
              <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                {/* Author row */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {r.authorName.charAt(0)}
                  </span>
                  <span className="font-semibold text-foreground text-sm">{r.authorName}</span>
                  {r.verified && (
                    <span className="flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <BadgeCheck className="size-3" />
                      {lang === 'ar' ? 'شراء موثّق' : 'Verified purchase'}
                    </span>
                  )}
                  <span className="ms-auto text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                <StarRow filled={r.rating} />

                {r.title && (
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{r.body}</p>

                {/* Actions row */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isLoggedIn && (
                    <button
                      onClick={() => handleHelpful(r.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isHelpful
                          ? 'border-primary/40 bg-primary/8 text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent',
                      )}
                    >
                      <ThumbsUp className="size-3" />
                      {lang === 'ar' ? `مفيد (${helpfulCount})` : `Helpful (${helpfulCount})`}
                    </button>
                  )}

                  {r.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(r.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="size-3" />
                      {r.replies.length} {lang === 'ar' ? 'ردود' : 'replies'}
                      {showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </button>
                  )}

                  {isSupplier && !replyingTo && (
                    <button
                      onClick={() => setReplyingTo(r.id)}
                      className="text-xs text-primary hover:underline ms-auto"
                    >
                      {lang === 'ar' ? 'ردّ' : 'Reply'}
                    </button>
                  )}
                </div>

                {/* Replies */}
                {showReplies && r.replies.length > 0 && (
                  <ul className="mt-3 space-y-2 border-s-2 border-primary/20 ps-4">
                    {r.replies.map((reply) => (
                      <li key={reply.id}>
                        <p className="text-xs font-semibold text-foreground">{reply.authorName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{reply.body}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Reply form */}
                {replyingTo === r.id && (
                  <ReplyForm
                    productId={productId}
                    reviewId={r.id}
                    onDone={() => { setReplyingTo(null); mutate() }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Not logged in prompt */}
      {!isLoggedIn && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {lang === 'ar' ? (
            <>سجّل دخولك لتتمكن من إضافة تقييم</>
          ) : (
            <>Sign in to leave a review</>
          )}
        </p>
      )}
    </section>
  )
}
