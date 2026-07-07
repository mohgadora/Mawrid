'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type AppConfig = {
  id: number
  key: string
  label: string
  description: string
  type: string
  value: string
}

const INITIAL: AppConfig[] = [
  { id: 1, key: 'ai_recommendations', label: 'التوصيات بالذكاء الاصطناعي', description: 'تفعيل توصيات المنتجات المدعومة بالـ AI', type: 'bool', value: 'true' },
  { id: 2, key: 'image_search', label: 'البحث بالصورة', description: 'السماح للمستخدمين بالبحث بالصور', type: 'bool', value: 'true' },
  { id: 3, key: 'voice_search', label: 'البحث الصوتي', description: 'تفعيل البحث الصوتي في التطبيق', type: 'bool', value: 'false' },
  { id: 4, key: 'dark_mode', label: 'الوضع الداكن', description: 'تمكين الوضع الداكن في التطبيق', type: 'bool', value: 'true' },
  { id: 5, key: 'price_alert', label: 'تنبيهات الأسعار', description: 'إرسال إشعارات عند انخفاض أسعار المنتجات', type: 'bool', value: 'true' },
  { id: 6, key: 'min_order_cartons', label: 'الحد الأدنى للطلب (كرتون)', description: 'أقل كمية مسموح بها للطلب الواحد', type: 'number', value: '2' },
  { id: 7, key: 'commission_rate', label: 'نسبة العمولة (%)', description: 'نسبة العمولة المأخوذة من كل طلب', type: 'number', value: '2' },
  { id: 8, key: 'support_email', label: 'بريد الدعم', description: 'عنوان البريد الإلكتروني لفريق الدعم', type: 'text', value: 'support@mawrid.sa' },
  { id: 9, key: 'maintenance_msg', label: 'رسالة الصيانة', description: 'رسالة تظهر خلال فترة الصيانة', type: 'text', value: 'نقوم بتحسين خدماتنا. نعود قريباً.' },
]

const TYPE_OPTIONS = [
  { value: 'bool', label: 'تبديل (نعم/لا)' },
  { value: 'number', label: 'رقم' },
  { value: 'text', label: 'نص' },
]

export default function AppConfigPage() {
  return (
    <AdminEntityManager<AppConfig>
      storageKey="admin-apps-config"
      initial={INITIAL}
      addLabel="إضافة إعداد"
      editLabel="تعديل الإعداد"
      emptyForm={{ key: '', label: '', description: '', type: 'text', value: '' }}
      columns={[
        { key: 'label', label: 'الإعداد' },
        { key: 'key', label: 'المفتاح' },
        { key: 'type', label: 'النوع' },
        { key: 'value', label: 'القيمة' },
      ]}
      fields={[
        { key: 'label', label: 'اسم الإعداد', required: true },
        { key: 'key', label: 'المفتاح البرمجي', required: true, dir: 'ltr' },
        { key: 'description', label: 'الوصف', type: 'textarea' },
        { key: 'type', label: 'النوع', type: 'select', options: TYPE_OPTIONS },
        { key: 'value', label: 'القيمة', required: true },
      ]}
    />
  )
}
