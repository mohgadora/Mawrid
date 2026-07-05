'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type Notification = {
  id: number
  title: string
  channel: string
  audience: string
  sent: number
  at: string
}

const INITIAL: Notification[] = [
  { id: 1, title: 'تنبيه: انتهاء عرض الجمعة', channel: 'push', audience: 'الكل', sent: 84200, at: '2026-07-04 10:00' },
  { id: 2, title: 'فلاش سيل — 4 ساعات فقط', channel: 'push', audience: 'التجار', sent: 8920, at: '2026-07-03 14:00' },
  { id: 3, title: 'تحديث سياسة الإرجاع', channel: 'email', audience: 'الكل', sent: 93120, at: '2026-07-01 09:00' },
  { id: 4, title: 'مرحباً بك — دليل الاستخدام', channel: 'email', audience: 'جدد', sent: 420, at: '2026-06-30 12:00' },
]

const CHANNEL_OPTIONS = [
  { value: 'push', label: 'Push (التطبيق)' },
  { value: 'email', label: 'البريد الإلكتروني' },
  { value: 'sms', label: 'رسالة SMS' },
]

const AUDIENCE_OPTIONS = [
  { value: 'الكل', label: 'الكل' },
  { value: 'التجار', label: 'التجار' },
  { value: 'الموردون', label: 'الموردون' },
  { value: 'جدد', label: 'المشترون الجدد' },
  { value: 'المميزون (VIP)', label: 'المميزون (VIP)' },
]

export default function NotificationsCenterPage() {
  return (
    <AdminEntityManager<Notification>
      storageKey="admin-notifications"
      initial={INITIAL}
      addLabel="إنشاء إشعار"
      editLabel="تعديل الإشعار"
      emptyForm={{ title: '', channel: 'push', audience: 'الكل', sent: 0, at: '' }}
      columns={[
        { key: 'title', label: 'العنوان' },
        { key: 'channel', label: 'القناة', render: (r) => r.channel === 'push' ? 'Push' : r.channel === 'email' ? 'Email' : 'SMS' },
        { key: 'audience', label: 'الجمهور' },
        { key: 'sent', label: 'المُرسل', render: (r) => r.sent.toLocaleString('ar-SA') },
        { key: 'at', label: 'التاريخ' },
      ]}
      fields={[
        { key: 'title', label: 'العنوان', required: true },
        { key: 'channel', label: 'قناة الإرسال', type: 'select', options: CHANNEL_OPTIONS },
        { key: 'audience', label: 'الجمهور المستهدف', type: 'select', options: AUDIENCE_OPTIONS },
        { key: 'sent', label: 'عدد المُرسل', type: 'number' },
        { key: 'at', label: 'تاريخ الإرسال', dir: 'ltr' },
      ]}
    />
  )
}
