'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  type SerializedNotification,
} from '@/lib/api-client'

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'الآن'
  if (mins < 60) return `منذ ${mins} د`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `منذ ${hrs} س`
  const days = Math.floor(hrs / 24)
  return `منذ ${days} ي`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<SerializedNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      const data = await getNotificationsApi()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function handleMarkAllRead() {
    await markAllNotificationsReadApi()
    await load()
  }

  async function handleClick(n: SerializedNotification) {
    if (!n.read) {
      await markNotificationReadApi(n.id)
      await load()
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  const displayed = notifications.slice(0, 10)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
        className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-border text-foreground transition-colors hover:bg-accent"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {displayed.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</p>
            ) : (
              displayed.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-start transition-colors hover:bg-accent ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
