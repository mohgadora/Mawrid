'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type LoyaltyRule = {
  id: number
  action: string
  points: number
  per: string
  status: string
}

const INITIAL: LoyaltyRule[] = [
  { id: 1, action: 'إتمام طلب', points: 10, per: 'كل 100 ريال مصروفة', status: 'active' },
  { id: 2, action: 'كتابة تقييم', points: 50, per: 'لكل تقييم', status: 'active' },
  { id: 3, action: 'دعوة صديق', points: 200, per: 'لكل دعوة مكتملة', status: 'active' },
  { id: 4, action: 'إتمام ملف المستخدم', points: 100, per: 'مرة واحدة', status: 'inactive' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function LoyaltyPage() {
  return (
    <AdminEntityManager<LoyaltyRule>
      storageKey="admin-loyalty"
      initial={INITIAL}
      addLabel="قاعدة جديدة"
      editLabel="تعديل القاعدة"
      emptyForm={{ action: '', points: 0, per: '', status: 'active' }}
      columns={[
        { key: 'action', label: 'الإجراء' },
        { key: 'per', label: 'التكرار' },
        { key: 'points', label: 'النقاط', render: (r) => `+${r.points} نقطة` },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'action', label: 'الإجراء', required: true },
        { key: 'per', label: 'التكرار', required: true },
        { key: 'points', label: 'النقاط', type: 'number', required: true },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
