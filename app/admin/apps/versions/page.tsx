'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type AppVersion = {
  id: number
  platform: string
  version: string
  build: string
  status: string
  released: string
  installs: number
  forceUpdate: string
}

const INITIAL: AppVersion[] = [
  { id: 1, platform: 'iOS', version: '3.2.1', build: '421', status: 'active', released: '2026-06-20', installs: 18400, forceUpdate: 'inactive' },
  { id: 2, platform: 'iOS', version: '3.2.0', build: '418', status: 'inactive', released: '2026-05-10', installs: 3200, forceUpdate: 'active' },
  { id: 3, platform: 'Android', version: '3.2.1', build: '380', status: 'active', released: '2026-06-22', installs: 24100, forceUpdate: 'inactive' },
  { id: 4, platform: 'Android', version: '3.1.5', build: '355', status: 'inactive', released: '2026-04-15', installs: 1800, forceUpdate: 'active' },
  { id: 5, platform: 'Web', version: '2026.07.1', build: '—', status: 'active', released: '2026-07-01', installs: 0, forceUpdate: 'inactive' },
]

const PLATFORM_OPTIONS = [
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'Web', label: 'Web' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'مهمل' },
]

const FORCE_OPTIONS = [
  { value: 'active', label: 'مفعّل' },
  { value: 'inactive', label: 'معطّل' },
]

export default function AppVersionsPage() {
  return (
    <AdminEntityManager<AppVersion>
      storageKey="admin-apps-versions"
      initial={INITIAL}
      addLabel="إصدار جديد"
      editLabel="تعديل الإصدار"
      emptyForm={{ platform: 'iOS', version: '', build: '', status: 'active', released: '', installs: 0, forceUpdate: 'inactive' }}
      columns={[
        { key: 'platform', label: 'المنصة' },
        { key: 'version', label: 'الإصدار' },
        { key: 'build', label: 'البناء' },
        { key: 'installs', label: 'التثبيتات', render: (r) => r.installs ? r.installs.toLocaleString('ar-SA') : '—' },
        { key: 'released', label: 'تاريخ الإصدار' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
        { key: 'forceUpdate', label: 'تحديث إجباري', render: (r) => statusChip(r.forceUpdate) },
      ]}
      fields={[
        { key: 'platform', label: 'المنصة', type: 'select', options: PLATFORM_OPTIONS },
        { key: 'version', label: 'الإصدار', required: true, dir: 'ltr' },
        { key: 'build', label: 'رقم البناء', dir: 'ltr' },
        { key: 'installs', label: 'التثبيتات', type: 'number' },
        { key: 'released', label: 'تاريخ الإصدار', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
        { key: 'forceUpdate', label: 'تحديث إجباري', type: 'select', options: FORCE_OPTIONS },
      ]}
    />
  )
}
