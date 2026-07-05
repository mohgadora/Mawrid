'use client'

import { useState } from 'react'
import { broadcastNotificationApi } from '@/lib/api-client'

const TYPE_OPTIONS = [
  { value: 'order', label: 'طلب (Order)' },
  { value: 'payment', label: 'دفع (Payment)' },
  { value: 'system', label: 'نظام (System)' },
  { value: 'promotion', label: 'عرض (Promotion)' },
]

export default function NotificationsCenterPage() {
  const [type, setType] = useState('system')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [targeting, setTargeting] = useState<'all' | 'specific'>('all')
  const [userIdsText, setUserIdsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!title.trim() || !body.trim()) {
      setError('العنوان والنص مطلوبان')
      return
    }
    const userIds =
      targeting === 'specific'
        ? userIdsText.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
    setLoading(true)
    try {
      await broadcastNotificationApi({ type, title: title.trim(), body: body.trim(), link: link.trim() || undefined, userIds })
      setSuccess(true)
      setTitle('')
      setBody('')
      setLink('')
      setUserIdsText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-xl p-6">
      <h2 className="mb-6 text-xl font-bold text-foreground">إرسال إشعار جماعي</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">النوع</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">العنوان <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الإشعار"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">النص <span className="text-destructive">*</span></label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="نص الإشعار..."
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Link */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">الرابط (اختياري)</label>
          <input
            type="text"
            dir="ltr"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/account/orders"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Targeting */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">المستهدفون</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="all" checked={targeting === 'all'} onChange={() => setTargeting('all')} />
              الكل
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="specific" checked={targeting === 'specific'} onChange={() => setTargeting('specific')} />
              مستخدمين محددين
            </label>
          </div>
          {targeting === 'specific' && (
            <textarea
              value={userIdsText}
              onChange={(e) => setUserIdsText(e.target.value)}
              rows={3}
              dir="ltr"
              placeholder="أدخل معرّفات المستخدمين مفصولة بفاصلة&#10;user-id-1, user-id-2, ..."
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {success && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">تم الإرسال بنجاح ✓</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}
        </button>
      </form>
    </div>
  )
}
