'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Announcement = {
  id: number
  title: string
  body: string
  type: string
  target: string
  status: string
  from: string
  to: string
}

const INITIAL: Announcement[] = [
  { id: 1, title: 'تحديث شروط الخدمة', body: 'تم تحديث شروط الخدمة وسياسة الخصوصية. يرجى المراجعة قبل الاستمرار.', type: 'info', target: 'الكل', status: 'active', from: '2026-07-01', to: '2026-07-15' },
  { id: 2, title: 'صيانة مجدولة', body: 'سيكون النظام غير متاح يوم الجمعة 5 يوليو من 2-4 صباحاً لأعمال الصيانة.', type: 'warning', target: 'الكل', status: 'active', from: '2026-07-04', to: '2026-07-05' },
  { id: 3, title: 'إطلاق ميزة طلب العينات', body: 'أصبح بإمكانك طلب عينات مجانية من الموردين قبل الطلب الكبير.', type: 'promo', target: 'المشترون', status: 'active', from: '2026-07-01', to: '2026-07-31' },
  { id: 4, title: 'تم حل مشكلة الدفع', body: 'تم إصلاح مشكلة بعض المدفوعات بنجاح. نعتذر عن الإزعاج.', type: 'success', target: 'الكل', status: 'inactive', from: '2026-06-28', to: '2026-06-30' },
]

const TYPE_OPTIONS = [
  { value: 'info', label: 'معلومة' },
  { value: 'warning', label: 'تنبيه' },
  { value: 'success', label: 'نجاح' },
  { value: 'promo', label: 'عرض' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function AnnouncementsPage() {
  return (
    <AdminEntityManager<Announcement>
      storageKey="admin-content-announcements"
      initial={INITIAL}
      addLabel="إعلان جديد"
      editLabel="تعديل الإعلان"
      emptyForm={{ title: '', body: '', type: 'info', target: 'الكل', status: 'active', from: '', to: '' }}
      columns={[
        { key: 'title', label: 'العنوان' },
        { key: 'type', label: 'النوع' },
        { key: 'target', label: 'الجمهور' },
        { key: 'from', label: 'من' },
        { key: 'to', label: 'إلى' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'title', label: 'العنوان', required: true },
        { key: 'body', label: 'النص', type: 'textarea', required: true },
        { key: 'type', label: 'النوع', type: 'select', options: TYPE_OPTIONS },
        { key: 'target', label: 'الجمهور المستهدف', required: true },
        { key: 'from', label: 'تاريخ البداية', dir: 'ltr' },
        { key: 'to', label: 'تاريخ النهاية', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
