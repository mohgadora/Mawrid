'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type Integration = {
  id: number
  name: string
  category: string
  description: string
  status: string
  since: string
}

const INITIAL: Integration[] = [
  { id: 1, name: 'Mada (SADAD)', category: 'المدفوعات', description: 'بوابة دفع محلية — مدى وسداد', status: 'active', since: '2024-01-10' },
  { id: 2, name: 'Visa / Mastercard', category: 'المدفوعات', description: 'بطاقات دولية عبر Cybersource', status: 'active', since: '2024-01-10' },
  { id: 3, name: 'Apple Pay', category: 'المدفوعات', description: 'دفع سريع عبر المحفظة', status: 'inactive', since: '2025-03-01' },
  { id: 4, name: 'Aramex', category: 'الشحن', description: 'تتبع وتسعير الشحنات', status: 'active', since: '2024-02-20' },
  { id: 5, name: 'SMSA Express', category: 'الشحن', description: 'شحن محلي سريع', status: 'active', since: '2024-06-15' },
  { id: 6, name: 'فاتورة (ZATCA)', category: 'الفوترة', description: 'الفاتورة الإلكترونية — هيئة الزكاة', status: 'active', since: '2024-03-01' },
  { id: 7, name: 'SAP ERP', category: 'ERP', description: 'مزامنة الطلبات والمخزون', status: 'active', since: '2025-01-08' },
  { id: 8, name: 'Salesforce CRM', category: 'CRM', description: 'إدارة علاقات العملاء التجاريين', status: 'inactive', since: '' },
  { id: 9, name: 'Twilio SMS', category: 'الإشعارات', description: 'رسائل OTP وتنبيهات الطلبات', status: 'active', since: '2024-01-15' },
  { id: 10, name: 'Firebase (Push)', category: 'الإشعارات', description: 'إشعارات التطبيق المحمول', status: 'active', since: '2024-01-15' },
  { id: 11, name: 'Google Analytics 4', category: 'التحليلات', description: 'تتبع سلوك المستخدمين', status: 'active', since: '2024-04-01' },
  { id: 12, name: 'Mixpanel', category: 'التحليلات', description: 'تحليلات متقدمة للمنتج', status: 'inactive', since: '' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'متصل' },
  { value: 'inactive', label: 'غير متصل' },
]

const CATEGORY_OPTIONS = [
  { value: 'المدفوعات', label: 'المدفوعات' },
  { value: 'الشحن', label: 'الشحن' },
  { value: 'الفوترة', label: 'الفوترة' },
  { value: 'ERP', label: 'ERP' },
  { value: 'CRM', label: 'CRM' },
  { value: 'الإشعارات', label: 'الإشعارات' },
  { value: 'التحليلات', label: 'التحليلات' },
]

export default function IntegrationsPage() {
  return (
    <AdminEntityManager<Integration>
      storageKey="admin-integrations"
      initial={INITIAL}
      layout="cards"
      addLabel="إضافة تكامل"
      editLabel="تعديل التكامل"
      cardTitle={(r) => r.name}
      cardSubtitle={(r) => `${r.category} — ${r.description}`}
      emptyForm={{ name: '', category: 'المدفوعات', description: '', status: 'inactive', since: '' }}
      columns={[
        { key: 'name', label: 'التكامل' },
        { key: 'category', label: 'الفئة' },
        { key: 'description', label: 'الوصف' },
        { key: 'since', label: 'متصل منذ' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'name', label: 'اسم التكامل', required: true },
        { key: 'category', label: 'الفئة', type: 'select', options: CATEGORY_OPTIONS },
        { key: 'description', label: 'الوصف', type: 'textarea', required: true },
        { key: 'since', label: 'متصل منذ', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
