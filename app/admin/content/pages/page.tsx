'use client'

import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

type CmsPage = {
  id: number
  title: string
  slug: string
  updated: string
  status: string
}

const INITIAL: CmsPage[] = [
  { id: 1, title: 'من نحن', slug: '/about', updated: '2026-06-10', status: 'published' },
  { id: 2, title: 'سياسة الخصوصية', slug: '/privacy', updated: '2026-05-01', status: 'published' },
  { id: 3, title: 'الشروط والأحكام', slug: '/terms', updated: '2026-05-01', status: 'published' },
  { id: 4, title: 'سياسة الإرجاع والاستبدال', slug: '/returns-policy', updated: '2026-04-20', status: 'published' },
  { id: 5, title: 'دليل المورد', slug: '/supplier-guide', updated: '2026-03-15', status: 'draft' },
  { id: 6, title: 'الأسئلة الشائعة — الشحن', slug: '/faq-shipping', updated: '2026-02-28', status: 'published' },
]

const STATUS_OPTIONS = [
  { value: 'published', label: 'منشور' },
  { value: 'draft', label: 'مسودة' },
]

export default function ContentPagesPage() {
  return (
    <AdminEntityManager<CmsPage>
      storageKey="admin-content-pages"
      initial={INITIAL}
      addLabel="صفحة جديدة"
      editLabel="تعديل الصفحة"
      emptyForm={{ title: '', slug: '', updated: '', status: 'draft' }}
      columns={[
        { key: 'title', label: 'العنوان' },
        { key: 'slug', label: 'الرابط' },
        { key: 'updated', label: 'آخر تحديث' },
        { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
      ]}
      fields={[
        { key: 'title', label: 'العنوان', required: true },
        { key: 'slug', label: 'الرابط', required: true, dir: 'ltr' },
        { key: 'updated', label: 'آخر تحديث', dir: 'ltr' },
        { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
      ]}
    />
  )
}
