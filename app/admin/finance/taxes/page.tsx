'use client'

import { FileCheck } from 'lucide-react'
import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'

const INVOICES = [
  { id: 'INV-2026-0041', buyer: 'سوبرماركت الفيصل', amount: 12400, vat: 1860, total: 14260, date: '2026-07-04', status: 'issued' },
  { id: 'INV-2026-0040', buyer: 'مطاعم الدرعية', amount: 5800, vat: 870, total: 6670, date: '2026-07-04', status: 'issued' },
  { id: 'INV-2026-0039', buyer: 'شركة التميمي', amount: 32000, vat: 4800, total: 36800, date: '2026-07-03', status: 'issued' },
]

type TaxRule = {
  id: number
  name: string
  rate: number
  status: string
}

const TAX_RULES: TaxRule[] = [
  { id: 1, name: 'ضريبة القيمة المضافة (SA)', rate: 15, status: 'active' },
  { id: 2, name: 'ضريبة الاستيراد — مشروبات', rate: 50, status: 'active' },
  { id: 3, name: 'إعفاء المنتجات الأساسية', rate: 0, status: 'active' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]

export default function TaxesPage() {
  return (
    <div className="route-fade space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">نسبة الضريبة (SA)</p>
          <p className="mt-1 text-3xl font-bold text-foreground">15%</p>
          <p className="text-[11px] text-success">مطابق لمتطلبات هيئة الزكاة</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">ضريبة هذا الشهر</p>
          <p className="mt-1 text-2xl font-bold text-foreground">43,350 ريال</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">فواتير هذا الشهر</p>
          <p className="mt-1 text-2xl font-bold text-foreground">12,540</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <FileCheck className="size-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">آخر الفواتير الضريبية</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-5 py-3 text-start font-medium">رقم الفاتورة</th>
              <th className="px-5 py-3 text-start font-medium">المشتري</th>
              <th className="px-5 py-3 text-start font-medium">قبل الضريبة</th>
              <th className="px-5 py-3 text-start font-medium">ضريبة 15%</th>
              <th className="px-5 py-3 text-start font-medium">الإجمالي</th>
              <th className="px-5 py-3 text-start font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-primary">{inv.id}</td>
                <td className="px-5 py-3 text-xs text-foreground">{inv.buyer}</td>
                <td className="px-5 py-3 text-xs text-foreground">{inv.amount.toLocaleString()} ريال</td>
                <td className="px-5 py-3 text-xs text-foreground">{inv.vat.toLocaleString()} ريال</td>
                <td className="px-5 py-3 text-xs font-bold text-foreground">{inv.total.toLocaleString()} ريال</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">قواعد الضريبة</p>
        <AdminEntityManager<TaxRule>
          storageKey="admin-finance-taxes"
          initial={TAX_RULES}
          addLabel="قاعدة ضريبية جديدة"
          editLabel="تعديل القاعدة"
          emptyForm={{ name: '', rate: 0, status: 'active' }}
          columns={[
            { key: 'name', label: 'الاسم' },
            { key: 'rate', label: 'النسبة', render: (r) => `${r.rate}%` },
            { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
          ]}
          fields={[
            { key: 'name', label: 'اسم القاعدة', required: true },
            { key: 'rate', label: 'النسبة (%)', type: 'number', required: true },
            { key: 'status', label: 'الحالة', type: 'select', options: STATUS_OPTIONS },
          ]}
        />
      </div>
    </div>
  )
}
