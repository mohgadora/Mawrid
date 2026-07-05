'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Campaign = {
  id: number
  name: string
  channel: string
  segment: string
  sent: number
  opens: number
  conversions: number
  status: string
  date: string
}

const INITIAL: Campaign[] = [
  { id: 1, name: 'خصم 15% عيد الفطر', channel: 'إشعار + SMS', segment: 'الكل', sent: 8920, opens: 6140, conversions: 812, status: 'completed', date: '2026-04-05' },
  { id: 2, name: 'عروض رمضان 2026', channel: 'إشعار', segment: 'التجار الكبار', sent: 84, opens: 72, conversions: 44, status: 'completed', date: '2026-03-01' },
  { id: 3, name: 'إعادة تفعيل غير النشطين', channel: 'بريد إلكتروني', segment: 'غير النشطين', sent: 201, opens: 89, conversions: 18, status: 'active', date: '2026-07-01' },
  { id: 4, name: 'أهلاً بالمشترين الجدد', channel: 'إشعار', segment: 'المشترون الجدد', sent: 312, opens: 290, conversions: 180, status: 'active', date: '2026-07-01' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function CampaignsPage() {
  return (
    <AdminEntityManager<Campaign>
      storageKey="admin-campaigns"
      initial={INITIAL}
      addLabel="حملة جديدة"
      editLabel="تعديل الحملة"
      emptyForm={{ name: '', channel: '', segment: '', sent: 0, opens: 0, conversions: 0, status: 'active', date: '' }}
      columns={[
        { key: 'name', label: 'الحملة' },
        { key: 'channel', label: 'القناة' },
        { key: 'segment', label: 'الشريحة' },
        { key: 'sent', label: 'تم الإرسال', render: (r) => r.sent.toLocaleString() },
        { key: 'opens', label: 'المفتوحات', render: (r) => r.opens.toLocaleString() },
        { key: 'conversions', label: 'التحويلات', render: (r) => r.conversions.toLocaleString() },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'name', label: 'اسم الحملة', required: true },
        { key: 'channel', label: 'القناة', required: true },
        { key: 'segment', label: 'الشريحة', required: true },
        { key: 'sent', label: 'تم الإرسال', type: 'number' },
        { key: 'opens', label: 'المفتوحات', type: 'number' },
        { key: 'conversions', label: 'التحويلات', type: 'number' },
        { key: 'date', label: 'التاريخ', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
