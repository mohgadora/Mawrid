'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export type NotifType = 'order' | 'deal' | 'system' | 'invite' | 'points'

export type Notification = {
  id: string
  type: NotifType
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  time: string
  read: boolean
  href?: string
}

const SEED: Notification[] = [
  {
    id: '1',
    type: 'order',
    titleAr: 'طلبك في الطريق إليك!',
    titleEn: 'Your order is on the way!',
    bodyAr: 'الطلب #ORD-0042 خرج للتوصيل ويُتوقع وصوله اليوم.',
    bodyEn: 'Order #ORD-0042 is out for delivery and expected today.',
    time: '10m',
    read: false,
    href: '/orders/ord-0042',
  },
  {
    id: '2',
    type: 'deal',
    titleAr: 'عرض لك فقط — خصم 15%',
    titleEn: 'Exclusive deal — 15% off',
    bodyAr: 'احصل على خصم 15% على زيت الطعام عند الشراء بكميات فوق 10 كراتين.',
    bodyEn: 'Get 15% off cooking oil when you order 10+ cartons.',
    time: '1h',
    read: false,
    href: '/',
  },
  {
    id: '3',
    type: 'points',
    titleAr: 'كسبت 120 نقطة مكافأة',
    titleEn: 'You earned 120 reward points',
    bodyAr: 'نقاطك الحالية: 1,340. تحقق من مكافآتك.',
    bodyEn: 'Your current balance: 1,340 pts. Check your rewards.',
    time: '3h',
    read: true,
    href: '/account',
  },
  {
    id: '4',
    type: 'invite',
    titleAr: 'قبل صديقك دعوتك!',
    titleEn: 'Your friend accepted your invite!',
    bodyAr: 'تم اضافة 200 نقطة لرصيدك كمكافأة الإحالة.',
    bodyEn: '200 points added to your balance as a referral reward.',
    time: '1d',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    titleAr: 'تحديث سياسة الشحن',
    titleEn: 'Shipping policy updated',
    bodyAr: 'تم تحديث شروط الشحن المجاني. الآن ابتداءً من 500 ريال.',
    bodyEn: 'Free shipping threshold updated to SAR 500.',
    time: '2d',
    read: true,
  },
]

type NotifCtx = {
  notifications: Notification[]
  unread: number
  markAllRead: () => void
  markRead: (id: string) => void
  dismiss: (id: string) => void
}

const Ctx = createContext<NotifCtx | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(SEED)

  const unread = notifications.filter((n) => !n.read).length

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <Ctx.Provider value={{ notifications, unread, markAllRead, markRead, dismiss }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
