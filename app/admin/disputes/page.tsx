'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Dispute = {
  id: number
  code: string
  order: string
  buyer: string
  supplier: string
  reason: string
  amount: number
  status: string
  date: string
}

const INITIAL: Dispute[] = [
  { id: 1, code: 'DSP-101', order: 'ORD-10040', buyer: 'مطاعم الدرعية', supplier: 'الخليج للمشروبات', reason: 'منتج تالف عند الاستلام', amount: 5800, status: 'open', date: '2026-07-04' },
  { id: 2, code: 'DSP-100', order: 'ORD-9921', buyer: 'أبو سعد للتجارة', supplier: 'مورد الوادي', reason: 'كمية ناقصة', amount: 1200, status: 'in_progress', date: '2026-07-03' },
  { id: 3, code: 'DSP-099', order: 'ORD-9814', buyer: 'هايبر بنده', supplier: 'شركة الحصاد', reason: 'منتج مختلف عن الوصف', amount: 3400, status: 'resolved', date: '2026-07-01' },
]

const STATUS_OPTIONS = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'resolved', label: 'محلول' },
  { value: 'closed', label: 'مغلق' },
]

export default function DisputesPage() {
  return (
    <AdminEntityManager<Dispute>
      storageKey="admin-disputes"
      initial={INITIAL}
      addLabel="نزاع جديد"
      editLabel="تعديل النزاع"
      emptyForm={{ code: '', order: '', buyer: '', supplier: '', reason: '', amount: 0, status: 'open', date: '' }}
      columns={[
        { key: 'code', label: 'رقم النزاع' },
        { key: 'order', label: 'الطلب' },
        { key: 'buyer', label: 'المشتري' },
        { key: 'supplier', label: 'المورد' },
        { key: 'reason', label: 'السبب' },
        { key: 'amount', label: 'المبلغ', render: (r) => `${r.amount.toLocaleString()} ريال` },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'code', label: 'رقم النزاع', required: true, dir: 'ltr' },
        { key: 'order', label: 'رقم الطلب', required: true, dir: 'ltr' },
        { key: 'buyer', label: 'المشتري', required: true },
        { key: 'supplier', label: 'المورد', required: true },
        { key: 'reason', label: 'السبب', required: true },
        { key: 'amount', label: 'المبلغ (ريال)', type: 'number' },
        { key: 'date', label: 'التاريخ', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
