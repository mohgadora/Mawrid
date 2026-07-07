'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Segment = {
  id: number
  name: string
  criteria: string
  members: number
  status: string
}

const INITIAL: Segment[] = [
  { id: 1, name: 'التجار الكبار', criteria: 'إنفاق > 500,000 ريال / سنة', members: 84, status: 'active' },
  { id: 2, name: 'المشترون الجدد', criteria: 'سجل خلال 30 يوم', members: 312, status: 'active' },
  { id: 3, name: 'غير النشطين', criteria: 'لم يشتروا منذ 60 يوم', members: 201, status: 'active' },
  { id: 4, name: 'مشترو المشروبات', criteria: 'تصنيف: مشروبات', members: 147, status: 'active' },
  { id: 5, name: 'عملاء VIP', criteria: 'تقييم > 4.8 + ولاء > 1000 نقطة', members: 29, status: 'active' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function SegmentsPage() {
  return (
    <AdminEntityManager<Segment>
      storageKey="admin-segments"
      initial={INITIAL}
      layout="cards"
      addLabel="شريحة جديدة"
      editLabel="تعديل الشريحة"
      cardTitle={(r) => r.name}
      cardSubtitle={(r) => `${r.members} عضو — ${r.criteria}`}
      emptyForm={{ name: '', criteria: '', members: 0, status: 'active' }}
      columns={[
        { key: 'name', label: 'الشريحة' },
        { key: 'criteria', label: 'المعايير' },
        { key: 'members', label: 'الأعضاء' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'name', label: 'اسم الشريحة', required: true },
        { key: 'criteria', label: 'معايير الانضمام', required: true },
        { key: 'members', label: 'عدد الأعضاء', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
