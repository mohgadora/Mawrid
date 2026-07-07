'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Package,
  Tag,
  Settings,
  UserPlus,
  Star,
  X,
  CheckCheck,
} from 'lucide-react'
import { useNotifications, type NotifType } from '@/lib/notifications'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<NotifType, typeof Bell> = {
  order: Package,
  deal: Tag,
  system: Settings,
  invite: UserPlus,
  points: Star,
}

const TYPE_COLOR: Record<NotifType, string> = {
  order: 'bg-chart-4/15 text-chart-4',
  deal: 'bg-primary/15 text-primary',
  system: 'bg-muted text-muted-foreground',
  invite: 'bg-success/15 text-success',
  points: 'bg-chart-3/15 text-chart-3',
}

export function NotificationsPanel() {
  const { t, lang } = useI18n()
  const { notifications, unread, markAllRead, markRead, dismiss } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl sm:w-96',
            lang === 'ar' ? 'end-0' : 'end-0',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-bold text-foreground">
              {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              {unread > 0 && (
                <span className="ms-2 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-black text-destructive">
                  {unread}
                </span>
              )}
            </h2>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CheckCheck className="size-3.5" />
                {lang === 'ar' ? 'تحديد الكل مقروء' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="flex flex-col items-center gap-2 py-10 text-center">
                <Bell className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </li>
            ) : (
              notifications.map((notif) => {
                const Icon = TYPE_ICON[notif.type] ?? Bell
                const iconCls = TYPE_COLOR[notif.type] ?? 'text-muted-foreground'
                const title = lang === 'ar' ? notif.titleAr : notif.titleEn
                const body = lang === 'ar' ? notif.bodyAr : notif.bodyEn

                return (
                  <li
                    key={notif.id}
                    className={cn(
                      'group relative flex gap-3 border-b border-border px-4 py-3 transition-colors last:border-0',
                      notif.read ? 'bg-transparent' : 'bg-primary/4',
                    )}
                  >
                    <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', iconCls)}>
                      <Icon className="size-4" />
                    </span>
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        markRead(notif.id)
                        if (notif.href) setOpen(false)
                      }}
                    >
                      {notif.href ? (
                        <Link href={notif.href} onClick={() => setOpen(false)}>
                          <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
                      )}
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground text-pretty">{body}</p>
                      <span className="mt-1 block text-[10px] text-muted-foreground/60">{notif.time}</span>
                    </div>
                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(notif.id)}
                      aria-label={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
                      className="hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground group-hover:flex focus-visible:flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" />
                    </button>
                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="absolute end-3 top-3.5 size-1.5 rounded-full bg-primary" />
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
