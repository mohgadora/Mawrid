'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type Faq = {
  id: number
  question: string
  answer: string
  category: string
  order: number
}

const INITIAL: Faq[] = [
  { id: 1, question: 'كيف أسجل كمورد في مَوْرِد؟', answer: 'اضغط على "كن شريكاً للتوصيل" في الصفحة الرئيسية وأكمل نموذج التسجيل. يستغرق المراجعة 2-3 أيام عمل.', category: 'التسجيل', order: 1 },
  { id: 2, question: 'ما هي الحد الأدنى لقيمة الطلب؟', answer: 'يختلف الحد الأدنى بحسب المورد والمنطقة، ويتراوح عادة بين 500 و2000 ريال.', category: 'الطلبات', order: 2 },
  { id: 3, question: 'كيف يتم احتساب سعر السوق؟', answer: 'يُحدَّث سعر السوق يومياً بناءً على متوسط أسعار الموردين المشتركين وأسعار الجملة الرسمية.', category: 'الأسعار', order: 3 },
  { id: 4, question: 'هل يمكن إلغاء الطلب بعد تأكيده؟', answer: 'يمكن إلغاء الطلب خلال 30 دقيقة من التأكيد قبل بدء التجهيز. بعد ذلك يتطلب التواصل مع الدعم.', category: 'الطلبات', order: 4 },
  { id: 5, question: 'ما هي طرق الدفع المتاحة؟', answer: 'نقبل مدى، بطاقات ائتمانية (Visa/Mastercard)، Apple Pay، وفاتورة آجلة للشركات المعتمدة.', category: 'الدفع', order: 5 },
]

const CATEGORY_OPTIONS = [
  { value: 'التسجيل', label: 'التسجيل' },
  { value: 'الطلبات', label: 'الطلبات' },
  { value: 'الأسعار', label: 'الأسعار' },
  { value: 'الدفع', label: 'الدفع' },
  { value: 'الشحن', label: 'الشحن' },
]

export default function FaqPage() {
  return (
    <AdminEntityManager<Faq>
      storageKey="admin-content-faq"
      initial={INITIAL}
      addLabel="سؤال جديد"
      editLabel="تعديل السؤال"
      emptyForm={{ question: '', answer: '', category: 'التسجيل', order: 0 }}
      columns={[
        { key: 'category', label: 'الفئة' },
        { key: 'question', label: 'السؤال' },
        { key: 'order', label: 'الترتيب' },
      ]}
      fields={[
        { key: 'question', label: 'السؤال', required: true },
        { key: 'answer', label: 'الإجابة', type: 'textarea', required: true },
        { key: 'category', label: 'الفئة', type: 'select', options: CATEGORY_OPTIONS },
        { key: 'order', label: 'الترتيب', type: 'number' },
      ]}
    />
  )
}
