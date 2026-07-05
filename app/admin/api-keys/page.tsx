'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type ApiKey = {
  id: number
  name: string
  key: string
  scopes: string
  created: string
  lastUsed: string
  status: string
}

const INITIAL: ApiKey[] = [
  { id: 1, name: 'Mobile App — iOS', key: 'mk_live_xK8mP2qLrN...9vTw', scopes: 'products:read, orders:write, users:read', created: '2026-01-10', lastUsed: '2026-07-04', status: 'active' },
  { id: 2, name: 'Mobile App — Android', key: 'mk_live_aJ4nQ7sRmK...3hBz', scopes: 'products:read, orders:write, users:read', created: '2026-01-10', lastUsed: '2026-07-04', status: 'active' },
  { id: 3, name: 'ERP Integration — SAP', key: 'mk_live_pF9cD5uWxY...2kGt', scopes: 'orders:read, finance:read', created: '2026-03-22', lastUsed: '2026-07-01', status: 'active' },
  { id: 4, name: 'Webhook Listener', key: 'mk_live_zL1vA3bNcM...6rXs', scopes: 'webhooks:write', created: '2026-05-01', lastUsed: '2026-06-28', status: 'inactive' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'معطّل' },
]

export default function ApiKeysPage() {
  return (
    <AdminEntityManager<ApiKey>
      storageKey="admin-api-keys"
      initial={INITIAL}
      addLabel="إنشاء مفتاح API جديد"
      editLabel="تعديل المفتاح"
      emptyForm={{ name: '', key: '', scopes: '', created: '', lastUsed: '', status: 'active' }}
      columns={[
        { key: 'name', label: 'الاسم' },
        { key: 'key', label: 'المفتاح' },
        { key: 'scopes', label: 'الصلاحيات' },
        { key: 'lastUsed', label: 'آخر استخدام' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'name', label: 'اسم المفتاح', required: true },
        { key: 'key', label: 'المفتاح', required: true, dir: 'ltr' },
        { key: 'scopes', label: 'الصلاحيات (مفصولة بفاصلة)', required: true, dir: 'ltr' },
        { key: 'created', label: 'تاريخ الإنشاء', dir: 'ltr' },
        { key: 'lastUsed', label: 'آخر استخدام', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
