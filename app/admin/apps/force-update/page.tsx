'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type ForceUpdate = {
  id: number
  platform: string
  status: string
  minVersion: string
  message: string
  storeUrl: string
}

const INITIAL: ForceUpdate[] = [
  {
    id: 1,
    platform: 'iOS',
    status: 'inactive',
    minVersion: '3.2.0',
    message: 'يتوفر تحديث جديد يحتوي على إصلاحات مهمة. يرجى تحديث التطبيق للاستمرار.',
    storeUrl: 'https://apps.apple.com/app/mawrid',
  },
  {
    id: 2,
    platform: 'Android',
    status: 'inactive',
    minVersion: '3.2.0',
    message: 'يتوفر تحديث جديد يحتوي على إصلاحات مهمة. يرجى تحديث التطبيق للاستمرار.',
    storeUrl: 'https://play.google.com/store/apps/details?id=sa.mawrid.app',
  },
]

const PLATFORM_OPTIONS = [
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'مفعّل' },
  { value: 'inactive', label: 'معطّل' },
]

export default function ForceUpdatePage() {
  return (
    <AdminEntityManager<ForceUpdate>
      storageKey="admin-apps-force-update"
      initial={INITIAL}
      addLabel="إضافة منصة"
      editLabel="تعديل التحديث الإجباري"
      emptyForm={{ platform: 'iOS', status: 'inactive', minVersion: '', message: '', storeUrl: '' }}
      columns={[
        { key: 'platform', label: 'المنصة' },
        { key: 'minVersion', label: 'الحد الأدنى للإصدار' },
        { key: 'storeUrl', label: 'رابط المتجر' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'platform', label: 'المنصة', type: 'select', options: PLATFORM_OPTIONS },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
        { key: 'minVersion', label: 'الحد الأدنى للإصدار المطلوب', required: true, dir: 'ltr' },
        { key: 'storeUrl', label: 'رابط المتجر', required: true, dir: 'ltr' },
        { key: 'message', label: 'رسالة التحديث', type: 'textarea', required: true },
      ]}
    />
  )
}
