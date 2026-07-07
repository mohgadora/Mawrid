'use client'

import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Link from 'next/link'
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Star,
  MessageSquare,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PartnerNotification {
  id: string
  type:
    | 'order_new'
    | 'order_status_changed'
    | 'product_approved'
    | 'product_rejected'
    | 'low_stock'
    | 'withdrawal_approved'
    | 'withdrawal_rejected'
    | 'review_received'
    | 'support_reply'
    | string
  title: string
  body: string
  read: boolean
  createdAt: string
  link?: string
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchNotifications(): Promise<PartnerNotification[]> {
  const res = await fetch('/api/v1/partner/notifications', {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('fetch failed')
  const json = await res.json()
  return json.data ?? json
}

async function markOneRead(id: string): Promise<void> {
  await fetch(`/api/v1/partner/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
}

async function markAllRead(): Promise<void> {
  await fetch('/api/v1/partner/notifications/read-all', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
}

// ---------------------------------------------------------------------------
// Relative time helper (Arabic)
// ---------------------------------------------------------------------------
function arabicRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'منذ لحظات'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  if (months < 12) return `منذ ${months} شهر`
  const years = Math.floor(months / 12)
  return `منذ ${years} سنة`
}

// ---------------------------------------------------------------------------
// Icon + label maps
// ---------------------------------------------------------------------------
const TYPE_ICON: Record<string, typeof Bell> = {
  order_new: ShoppingCart,
  order_status_changed: ShoppingCart,
  product_approved: CheckCircle,
  product_rejected: XCircle,
  low_stock: AlertTriangle,
  withdrawal_approved: DollarSign,
  withdrawal_rejected: DollarSign,
  review_received: Star,
  support_reply: MessageSquare,
}

const TYPE_LABEL: Record<string, string> = {
  order_new: 'طلب جديد',
  order_status_changed: 'تحديث الطلب',
  product_approved: 'تمت الموافقة على المنتج',
  product_rejected: 'تم رفض المنتج',
  low_stock: 'مخزون منخفض',
  withdrawal_approved: 'تمت الموافقة على السحب',
  withdrawal_rejected: 'تم رفض السحب',
  review_received: 'تقييم جديد',
  support_reply: 'رد على تذكرتك',
}

const TYPE_COLOR: Record<string, string> = {
  order_new: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  order_status_changed: 'text-blue-400 bg-blue-50 dark:bg-blue-950',
  product_approved: 'text-green-500 bg-green-50 dark:bg-green-950',
  product_rejected: 'text-red-500 bg-red-50 dark:bg-red-950',
  low_stock: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
  withdrawal_approved: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  withdrawal_rejected: 'text-red-500 bg-red-50 dark:bg-red-950',
  review_received: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  support_reply: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type Filter = 'all' | 'unread'

export default function PartnerNotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { data, error, isLoading, mutate } = useSWR('partner/notifications', fetchNotifications)

  const unreadCount = data ? data.filter((n) => !n.read).length : 0
  const visible =
    data && filter === 'unread' ? data.filter((n) => !n.read) : data ?? []

  async function handleMarkOne(notification: PartnerNotification) {
    if (notification.read) return
    // Optimistic update
    mutate(
      data?.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      false
    )
    await markOneRead(notification.id)
    mutate()
  }

  async function handleMarkAll() {
    mutate(data?.map((n) => ({ ...n, read: true })), false)
    await markAllRead()
    mutate()
  }

  return (
    <div className="route-fade space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">التنبيهات</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['all', 'unread'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              filter === f
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? 'الكل' : 'غير مقروء'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="mr-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          حدث خطأ في تحميل التنبيهات.{' '}
          <button className="underline" onClick={() => mutate()}>
            أعد المحاولة
          </button>
        </div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Bell className="size-10 opacity-30" />
          <p className="text-sm">لا توجد تنبيهات</p>
        </div>
      )}

      {!isLoading && !error && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={handleMarkOne}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------
function NotificationRow({
  notification,
  onRead,
}: {
  notification: PartnerNotification
  onRead: (n: PartnerNotification) => void
}) {
  const Icon = TYPE_ICON[notification.type] ?? Bell
  const iconColor =
    TYPE_COLOR[notification.type] ?? 'text-muted-foreground bg-muted'
  const typeLabel = TYPE_LABEL[notification.type] ?? notification.type

  const inner = (
    <div
      className={cn(
        'relative flex items-start gap-4 rounded-xl border p-4 transition-colors',
        notification.read
          ? 'border-border bg-card'
          : 'border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20'
      )}
      onClick={() => onRead(notification)}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span className="absolute left-4 top-4 size-2 rounded-full bg-blue-500" />
      )}

      {/* Icon */}
      <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', iconColor)}>
        <Icon className="size-4" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-xs font-medium text-muted-foreground">{typeLabel}</span>
          <span className="text-xs text-muted-foreground">{arabicRelativeTime(notification.createdAt)}</span>
        </div>
        <p className={cn('mt-0.5 text-sm font-semibold', notification.read ? 'text-foreground' : 'text-foreground')}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} className="block cursor-pointer">
        {inner}
      </Link>
    )
  }

  return <div className="cursor-pointer">{inner}</div>
}
