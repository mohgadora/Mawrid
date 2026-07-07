'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type FeatureFlag = {
  id: number
  key: string
  label: string
  description: string
  status: string
}

const INITIAL: FeatureFlag[] = [
  { id: 1, key: 'enable_quick_order', label: 'الطلب السريع (Quick Order)', description: 'تفعيل رفع Excel للطلب الجماعي', status: 'active' },
  { id: 2, key: 'enable_ai_recommendations', label: 'توصيات الذكاء الاصطناعي', description: 'عرض منتجات مقترحة بناء على سلوك المستخدم', status: 'active' },
  { id: 3, key: 'enable_voice_search', label: 'البحث الصوتي', description: 'بحث بالصوت في كتالوج المنتجات', status: 'active' },
  { id: 4, key: 'enable_image_search', label: 'البحث بالصورة', description: 'التعرف على المنتج من خلال صورة', status: 'active' },
  { id: 5, key: 'enable_loyalty_v2', label: 'نظام الولاء v2', description: 'النسخة المحدثة من نقاط المكافآت', status: 'inactive' },
  { id: 6, key: 'show_rfq_tab', label: 'طلب عروض الأسعار (RFQ)', description: 'تبويب طلبات التسعير للتجار', status: 'inactive' },
  { id: 7, key: 'enable_push_deals', label: 'إشعارات العروض الفورية', description: 'إرسال إشعار فوري عند بدء فلاش سيل', status: 'active' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'مفعّل' },
  { value: 'inactive', label: 'معطّل' },
]

export default function AppsPage() {
  return (
    <AdminEntityManager<FeatureFlag>
      storageKey="admin-apps"
      initial={INITIAL}
      addLabel="إضافة ميزة"
      editLabel="تعديل الميزة"
      emptyForm={{ key: '', label: '', description: '', status: 'inactive' }}
      columns={[
        { key: 'label', label: 'الميزة' },
        { key: 'key', label: 'المفتاح' },
        { key: 'description', label: 'الوصف' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'label', label: 'اسم الميزة', required: true },
        { key: 'key', label: 'المفتاح البرمجي', required: true, dir: 'ltr' },
        { key: 'description', label: 'الوصف', type: 'textarea' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
