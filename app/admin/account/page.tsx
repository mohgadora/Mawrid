'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type AccountField = {
  id: number
  category: string
  label: string
  value: string
}

const INITIAL: AccountField[] = [
  { id: 1, category: 'الملف الشخصي', label: 'الاسم الأول', value: 'أحمد' },
  { id: 2, category: 'الملف الشخصي', label: 'الاسم الأخير', value: 'العمري' },
  { id: 3, category: 'الملف الشخصي', label: 'البريد الإلكتروني', value: 'ahmed.omari@mourrid.sa' },
  { id: 4, category: 'الملف الشخصي', label: 'رقم الجوال', value: '+966 55 123 4567' },
  { id: 5, category: 'الملف الشخصي', label: 'الدور', value: 'Super Admin' },
  { id: 6, category: 'تفضيلات الإشعارات', label: 'طلبات موافقة جديدة', value: 'مفعّل' },
  { id: 7, category: 'تفضيلات الإشعارات', label: 'تنبيهات الطلبات الحرجة', value: 'مفعّل' },
  { id: 8, category: 'تفضيلات الإشعارات', label: 'أخطاء النظام والخدمات', value: 'مفعّل' },
  { id: 9, category: 'تفضيلات الإشعارات', label: 'تقرير أسبوعي بالبريد', value: 'معطّل' },
  { id: 10, category: 'الأمان', label: 'المصادقة الثنائية (2FA)', value: 'مفعّلة' },
]

const CATEGORY_OPTIONS = [
  { value: 'الملف الشخصي', label: 'الملف الشخصي' },
  { value: 'الأمان', label: 'الأمان' },
  { value: 'تفضيلات الإشعارات', label: 'تفضيلات الإشعارات' },
]

export default function AdminAccountPage() {
  return (
    <AdminEntityManager<AccountField>
      storageKey="admin-account"
      initial={INITIAL}
      addLabel="إضافة حقل"
      editLabel="تعديل الحقل"
      emptyForm={{ category: 'الملف الشخصي', label: '', value: '' }}
      columns={[
        { key: 'category', label: 'الفئة' },
        { key: 'label', label: 'الحقل' },
        { key: 'value', label: 'القيمة' },
      ]}
      fields={[
        { key: 'category', label: 'الفئة', type: 'select', options: CATEGORY_OPTIONS },
        { key: 'label', label: 'اسم الحقل', required: true },
        { key: 'value', label: 'القيمة', required: true },
      ]}
    />
  )
}
