'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Banner = {
  id: number
  title: string
  target: string
  screen: string
  from: string
  to: string
  status: string
  clicks: number
  impressions: number
}

const INITIAL: Banner[] = [
  { id: 1, title: 'عروض رمضان 2026', target: 'كل المستخدمين', screen: 'الرئيسية', from: '2026-03-01', to: '2026-03-31', status: 'active', clicks: 14200, impressions: 98000 },
  { id: 2, title: 'اطلب صنف غير موجود', target: 'تجار جملة', screen: 'الرئيسية', from: '2026-06-01', to: '2026-12-31', status: 'active', clicks: 3400, impressions: 42000 },
  { id: 3, title: 'تطبيق مَوْرِد الجديد', target: 'مستخدمو الويب', screen: 'كل الصفحات', from: '2026-05-15', to: '2026-07-15', status: 'active', clicks: 870, impressions: 15000 },
  { id: 4, title: 'خصم 15% للطلب الأول', target: 'مستخدمون جدد', screen: 'تسجيل الدخول', from: '2026-01-01', to: '2026-06-30', status: 'inactive', clicks: 6800, impressions: 62000 },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function BannersPage() {
  return (
    <AdminEntityManager<Banner>
      storageKey="admin-apps-banners"
      initial={INITIAL}
      addLabel="إضافة بانر"
      editLabel="تعديل البانر"
      emptyForm={{ title: '', target: '', screen: '', from: '', to: '', status: 'active', clicks: 0, impressions: 0 }}
      columns={[
        { key: 'title', label: 'البانر' },
        { key: 'target', label: 'الجمهور' },
        { key: 'screen', label: 'الشاشة' },
        { key: 'from', label: 'من' },
        { key: 'to', label: 'إلى' },
        { key: 'clicks', label: 'النقرات' },
        { key: 'impressions', label: 'المشاهدات' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'title', label: 'عنوان البانر', required: true },
        { key: 'target', label: 'الجمهور المستهدف', required: true },
        { key: 'screen', label: 'الشاشة', required: true },
        { key: 'from', label: 'تاريخ البداية', dir: 'ltr' },
        { key: 'to', label: 'تاريخ النهاية', dir: 'ltr' },
        { key: 'clicks', label: 'النقرات', type: 'number' },
        { key: 'impressions', label: 'المشاهدات', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
