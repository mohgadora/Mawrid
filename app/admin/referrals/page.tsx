'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type Referrer = {
  id: number
  name: string
  referrals: number
  earned: number
}

const INITIAL: Referrer[] = [
  { id: 1, name: 'سوبرماركت الفيصل', referrals: 12, earned: 2400 },
  { id: 2, name: 'مطاعم الدرعية', referrals: 8, earned: 1600 },
  { id: 3, name: 'شركة التميمي', referrals: 6, earned: 1200 },
  { id: 4, name: 'فندق الرياض', referrals: 4, earned: 800 },
]

export default function ReferralsPage() {
  return (
    <AdminEntityManager<Referrer>
      storageKey="admin-referrals"
      initial={INITIAL}
      addLabel="إضافة داعٍ"
      editLabel="تعديل الداعي"
      emptyForm={{ name: '', referrals: 0, earned: 0 }}
      columns={[
        { key: 'name', label: 'الداعي' },
        { key: 'referrals', label: 'الدعوات' },
        { key: 'earned', label: 'المكافآت', render: (r) => `${r.earned.toLocaleString()} ريال` },
      ]}
      fields={[
        { key: 'name', label: 'اسم الداعي', required: true },
        { key: 'referrals', label: 'عدد الدعوات', type: 'number' },
        { key: 'earned', label: 'المكافآت (ريال)', type: 'number' },
      ]}
    />
  )
}
