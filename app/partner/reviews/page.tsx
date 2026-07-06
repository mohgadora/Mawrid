'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { MessageSquare, Star, Clock, CheckCircle2, Flag } from 'lucide-react'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/lib/toast'

// ── Types ────────────────────────────────────────────────────────────────────

type PartnerReview = {
  id: string
  productId: string
  productName: string
  rating: number
  userId: string
  comment: string
  body?: string
  createdAt: string
  verified: boolean
  reply?: {
    id: string
    body: string
    createdAt: string
  } | null
}

type ReviewsResponse = {
  reviews: PartnerReview[]
  summary: {
    total: number
    average: number
    pendingReplies: number
    fiveStarCount: number
  }
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchPartnerReviews(): Promise<ReviewsResponse> {
  const res = await fetch('/api/v1/partner/reviews', {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  const json = await res.json()
  if (json && typeof json === 'object' && 'data' in json) return json.data
  return json
}

// ── Star Display ─────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'text-base' : 'text-sm'
  return (
    <span className={cls} aria-label={`${rating} من 5 نجوم`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-500' : 'text-muted-foreground/30'}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

// ── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`grid size-10 flex-shrink-0 place-items-center rounded-xl ${accent ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

// ── Reply Dialog ─────────────────────────────────────────────────────────────

function ReplyDialog({
  review,
  open,
  onClose,
  onSuccess,
}: {
  review: PartnerReview | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error: toastError } = useToast()
  const [body, setBody] = useState(review?.reply?.body ?? '')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasReply = Boolean(review?.reply)
  const showForm = !hasReply || editing

  async function handleSubmit() {
    if (!review || !body.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/partner/reviews/${encodeURIComponent(review.id)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      success('تم إرسال الرد — سيظهر على صفحة المنتج قريباً')
      onSuccess()
      onClose()
    } catch (e) {
      toastError((e as Error).message || 'فشل إرسال الرد')
    } finally {
      setSubmitting(false)
    }
  }

  if (!review) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{hasReply ? 'الرد على التقييم' : 'إضافة رد'}</DialogTitle>
        </DialogHeader>

        {/* Review read-only */}
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <StarRating rating={review.rating} size="md" />
            <span className="text-xs text-muted-foreground font-mono">{review.userId.slice(0, 8)}…</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{review.body ?? review.comment}</p>
          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('ar-SA')}</p>
        </div>

        {/* Existing reply */}
        {hasReply && !editing && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
            <p className="text-xs font-medium text-primary">ردك الحالي</p>
            <p className="text-sm text-foreground leading-relaxed">{review.reply!.body}</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => { setBody(review.reply!.body); setEditing(true) }}>
              تعديل الرد
            </Button>
          </div>
        )}

        {/* Reply form */}
        {showForm && (
          <div className="space-y-2">
            <Label htmlFor="reply-body">{hasReply ? 'تعديل الرد' : 'نص الرد'}</Label>
            <Textarea
              id="reply-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب ردك على العميل هنا…"
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button variant="outline" onClick={onClose} disabled={submitting}>إلغاء</Button>
          {showForm && (
            <Button onClick={handleSubmit} disabled={submitting || !body.trim()}>
              {submitting ? 'جارٍ الإرسال…' : hasReply ? 'حفظ التعديل' : 'إرسال الرد'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Report Dialog ─────────────────────────────────────────────────────────────

function ReportDialog({
  review,
  open,
  onClose,
}: {
  review: PartnerReview | null
  open: boolean
  onClose: () => void
}) {
  const { success, error: toastError } = useToast()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!review || !reason.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/partner/reviews/${encodeURIComponent(review.id)}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      success('تم إرسال البلاغ — سيراجعه الفريق خلال 48 ساعة')
      setReason('')
      onClose()
    } catch (e) {
      toastError((e as Error).message || 'فشل إرسال البلاغ')
    } finally {
      setSubmitting(false)
    }
  }

  if (!review) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن تقييم</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          يُستخدم هذا الخيار للإبلاغ عن تقييمات تنتهك سياسة المنصة (محتوى مسيء، مضلل، أو غير ذي صلة).
        </p>
        <div className="space-y-2">
          <Label htmlFor="report-reason">سبب البلاغ</Label>
          <Textarea
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اذكر سبب الإبلاغ بوضوح…"
            rows={3}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button variant="outline" onClick={onClose} disabled={submitting}>إلغاء</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? 'جارٍ الإرسال…' : 'إرسال البلاغ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerReviewsPage() {
  const { data, error, isLoading, mutate } = useSWR('partner/reviews', fetchPartnerReviews)

  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [replyFilter, setReplyFilter] = useState<string>('all')

  const [replyTarget, setReplyTarget] = useState<PartnerReview | null>(null)
  const [reportTarget, setReportTarget] = useState<PartnerReview | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data.reviews
    if (ratingFilter !== 'all') {
      const r = Number(ratingFilter)
      list = list.filter((rev) => rev.rating === r)
    }
    if (replyFilter === 'replied') {
      list = list.filter((rev) => Boolean(rev.reply))
    } else if (replyFilter === 'pending') {
      list = list.filter((rev) => !rev.reply)
    }
    return list
  }, [data, ratingFilter, replyFilter])

  return (
    <div className="route-fade space-y-6" dir="rtl">
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton cards={4} rows={5} />}
        onRetry={() => mutate()}
      >
        {(payload) => (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={MessageSquare}
                label="إجمالي التقييمات"
                value={payload.summary.total}
                accent="bg-primary/10 text-primary"
              />
              <SummaryCard
                icon={Star}
                label="متوسط التقييم"
                value={payload.summary.average.toFixed(1)}
                sub="من 5 نجوم"
                accent="bg-yellow-500/10 text-yellow-600"
              />
              <SummaryCard
                icon={Clock}
                label="بانتظار الرد"
                value={payload.summary.pendingReplies}
                accent="bg-orange-500/10 text-orange-600"
              />
              <SummaryCard
                icon={CheckCircle2}
                label="تقييمات 5 نجوم"
                value={payload.summary.fiveStarCount}
                accent="bg-emerald-500/10 text-emerald-600"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v ?? 'all')}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="التقييم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التقييمات</SelectItem>
                  <SelectItem value="5">5 ★★★★★</SelectItem>
                  <SelectItem value="4">4 ★★★★☆</SelectItem>
                  <SelectItem value="3">3 ★★★☆☆</SelectItem>
                  <SelectItem value="2">2 ★★☆☆☆</SelectItem>
                  <SelectItem value="1">1 ★☆☆☆☆</SelectItem>
                </SelectContent>
              </Select>

              <Select value={replyFilter} onValueChange={(v) => setReplyFilter(v ?? 'all')}>
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="حالة الرد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="replied">تم الرد</SelectItem>
                  <SelectItem value="pending">بانتظار الرد</SelectItem>
                </SelectContent>
              </Select>

              {(ratingFilter !== 'all' || replyFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground"
                  onClick={() => { setRatingFilter('all'); setReplyFilter('all') }}
                >
                  مسح الفلاتر
                </Button>
              )}

              <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                {filtered.length} نتيجة
              </span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">المنتج</th>
                    <th className="px-4 py-3 text-start font-medium">التقييم</th>
                    <th className="px-4 py-3 text-start font-medium">العميل</th>
                    <th className="px-4 py-3 text-start font-medium">التعليق</th>
                    <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                    <th className="px-4 py-3 text-center font-medium">موثّق</th>
                    <th className="px-4 py-3 text-center font-medium">الرد</th>
                    <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((review) => (
                    <tr key={review.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      {/* Product */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground line-clamp-1 max-w-[140px] block">{review.productName}</span>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{review.userId.slice(0, 8)}…</span>
                      </td>

                      {/* Comment preview */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{review.comment}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 tabular-nums">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </td>

                      {/* Verified badge */}
                      <td className="px-4 py-3 text-center">
                        {review.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            موثّق
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Reply status */}
                      <td className="px-4 py-3 text-center">
                        {review.reply ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <MessageSquare className="size-3" />
                            تم الرد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
                            <Clock className="size-3" />
                            بانتظار
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => setReplyTarget(review)}
                          >
                            <MessageSquare className="size-3" />
                            {review.reply ? 'عرض الرد' : 'رد'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setReportTarget(review)}
                          >
                            <Flag className="size-3" />
                            إبلاغ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                        لا توجد تقييمات مطابقة للفلاتر المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AsyncContent>

      {/* Dialogs */}
      <ReplyDialog
        key={replyTarget?.id ?? 'reply-dialog'}
        review={replyTarget}
        open={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        onSuccess={() => mutate()}
      />
      <ReportDialog
        review={reportTarget}
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
      />
    </div>
  )
}
