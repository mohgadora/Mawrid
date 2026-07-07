'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Chat = {
  id: number
  code: string
  user: string
  agent: string
  lastMsg: string
  status: string
  time: string
}

const INITIAL: Chat[] = [
  { id: 1, code: 'CHT-001', user: 'سوبرماركت الفيصل', agent: 'سارة القحطاني', lastMsg: 'هل يمكنني تعديل الطلب؟', status: 'active', time: '10:42' },
  { id: 2, code: 'CHT-002', user: 'مطاعم الدرعية', agent: 'غير محدد', lastMsg: 'أريد الاستفسار عن الفاتورة', status: 'pending', time: '10:30' },
  { id: 3, code: 'CHT-003', user: 'شركة التميمي', agent: 'أحمد العمري', lastMsg: 'شكراً جزيلاً', status: 'resolved', time: '09:55' },
  { id: 4, code: 'CHT-004', user: 'أبو سعد للتجارة', agent: 'سارة القحطاني', lastMsg: 'متى يصل الطلب؟', status: 'active', time: '09:20' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'pending', label: 'بانتظار الرد' },
  { value: 'resolved', label: 'محلول' },
]

export default function SupportChatsPage() {
  return (
    <AdminEntityManager<Chat>
      storageKey="admin-support-chats"
      initial={INITIAL}
      addLabel="محادثة جديدة"
      editLabel="تعديل المحادثة"
      emptyForm={{ code: '', user: '', agent: '', lastMsg: '', status: 'pending', time: '' }}
      columns={[
        { key: 'code', label: 'رقم المحادثة' },
        { key: 'user', label: 'المستخدم' },
        { key: 'agent', label: 'الوكيل' },
        { key: 'lastMsg', label: 'آخر رسالة' },
        { key: 'time', label: 'الوقت' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'code', label: 'رقم المحادثة', required: true, dir: 'ltr' },
        { key: 'user', label: 'المستخدم', required: true },
        { key: 'agent', label: 'الوكيل' },
        { key: 'lastMsg', label: 'آخر رسالة', required: true },
        { key: 'time', label: 'الوقت', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
