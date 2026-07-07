/* ─────────────────────────────────────────────────────────────
   Admin mock data — used across all /admin/* pages
   ───────────────────────────────────────────────────────────── */

// ── KPI ──────────────────────────────────────────────────────
export const KPI = {
  gmv: 4_820_350,
  gmvGrowth: 18.4,
  orders: 12_540,
  ordersGrowth: 9.1,
  suppliers: 384,
  suppliersGrowth: 5.2,
  buyers: 8_920,
  buyersGrowth: 22.7,
  pendingApprovals: 47,
  openTickets: 83,
  revenue: 289_221,
  revenueGrowth: 14.3,
}

export const REVENUE_CHART = [
  { month: 'يناير', value: 210000 },
  { month: 'فبراير', value: 195000 },
  { month: 'مارس', value: 241000 },
  { month: 'أبريل', value: 228000 },
  { month: 'مايو', value: 267000 },
  { month: 'يونيو', value: 289221 },
]

// ── Approvals ─────────────────────────────────────────────────
export type ApprovalType =
  | 'kyc'
  | 'supplier'
  | 'product'
  | 'promotion'
  | 'review'
  | 'refund'
  | 'price'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type Approval = {
  id: string
  type: ApprovalType
  title: string
  subtitle: string
  submittedAt: string
  status: ApprovalStatus
  priority: 'high' | 'medium' | 'low'
}

export const APPROVALS: Approval[] = [
  { id: 'APR-001', type: 'kyc', title: 'شركة الوادي للأغذية', subtitle: 'KYC — تحقق من هوية التاجر', submittedAt: '2026-07-04 09:12', status: 'pending', priority: 'high' },
  { id: 'APR-002', type: 'supplier', title: 'مورد الخليج للمشروبات', subtitle: 'طلب انضمام مورد جديد', submittedAt: '2026-07-04 08:50', status: 'pending', priority: 'high' },
  { id: 'APR-003', type: 'product', title: 'أرز بسمتي فاخر 50 كجم', subtitle: 'نشر منتج — شركة النخيل', submittedAt: '2026-07-04 08:30', status: 'pending', priority: 'medium' },
  { id: 'APR-004', type: 'promotion', title: 'خصم 20% — رمضان 2026', subtitle: 'حملة ترويجية', submittedAt: '2026-07-04 07:45', status: 'pending', priority: 'medium' },
  { id: 'APR-005', type: 'review', title: 'مراجعة مسيئة — منتج #1082', subtitle: 'تقرير مستخدم', submittedAt: '2026-07-04 07:10', status: 'pending', priority: 'low' },
  { id: 'APR-006', type: 'refund', title: 'طلب استرداد — طلب #ORD-9921', subtitle: 'مبلغ: 1,200 ريال', submittedAt: '2026-07-03 22:05', status: 'approved', priority: 'high' },
  { id: 'APR-007', type: 'price', title: 'تحديث سعر السوق — زيوت نباتية', subtitle: 'مصدر: وزارة التجارة', submittedAt: '2026-07-03 18:00', status: 'rejected', priority: 'medium' },
  { id: 'APR-008', type: 'kyc', title: 'مجموعة البحر الأحمر', subtitle: 'KYC — تحقق من هوية التاجر', submittedAt: '2026-07-03 15:30', status: 'pending', priority: 'high' },
]

// ── Orders ────────────────────────────────────────────────────
export type AdminOrder = {
  id: string
  buyer: string
  supplier: string
  amount: number
  items: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  date: string
}

export const ADMIN_ORDERS: AdminOrder[] = [
  { id: 'ORD-10041', buyer: 'سوبرماركت الفيصل', supplier: 'شركة النخيل للأغذية', amount: 12400, items: 8, status: 'delivered', date: '2026-07-04' },
  { id: 'ORD-10040', buyer: 'مطاعم الدرعية', supplier: 'الخليج للمشروبات', amount: 5800, items: 4, status: 'shipped', date: '2026-07-04' },
  { id: 'ORD-10039', buyer: 'شركة التميمي', supplier: 'مورد الوادي', amount: 32000, items: 15, status: 'confirmed', date: '2026-07-03' },
  { id: 'ORD-10038', buyer: 'هايبر بنده', supplier: 'شركة الحصاد', amount: 88500, items: 30, status: 'pending', date: '2026-07-03' },
  { id: 'ORD-10037', buyer: 'مجمع العثيم', supplier: 'شركة النخيل للأغذية', amount: 61200, items: 22, status: 'delivered', date: '2026-07-02' },
  { id: 'ORD-10036', buyer: 'فندق الرياض', supplier: 'الخليج للمشروبات', amount: 9100, items: 6, status: 'cancelled', date: '2026-07-02' },
]

// ── Suppliers ─────────────────────────────────────────────────
export type SupplierStatus = 'active' | 'pending' | 'suspended'

export const ADMIN_SUPPLIERS = [
  { id: 'SUP-001', name: 'شركة النخيل للأغذية', category: 'مواد غذائية', products: 142, orders: 1820, rating: 4.8, status: 'active' as SupplierStatus, joined: '2024-03-15' },
  { id: 'SUP-002', name: 'الخليج للمشروبات', category: 'مشروبات', products: 68, orders: 942, rating: 4.5, status: 'active' as SupplierStatus, joined: '2024-05-20' },
  { id: 'SUP-003', name: 'مورد الوادي', category: 'معلبات', products: 95, orders: 701, rating: 4.3, status: 'pending' as SupplierStatus, joined: '2026-06-10' },
  { id: 'SUP-004', name: 'شركة الحصاد', category: 'حبوب وأرز', products: 51, orders: 430, rating: 4.6, status: 'active' as SupplierStatus, joined: '2025-01-08' },
  { id: 'SUP-005', name: 'بيت الزيوت', category: 'زيوت وسمن', products: 34, orders: 218, rating: 3.9, status: 'suspended' as SupplierStatus, joined: '2025-07-22' },
]

// ── Buyers ────────────────────────────────────────────────────
export const ADMIN_BUYERS = [
  { id: 'BUY-001', name: 'سوبرماركت الفيصل', type: 'تاجر', orders: 84, spend: 420000, status: 'active', joined: '2024-04-01' },
  { id: 'BUY-002', name: 'مطاعم الدرعية', type: 'مستهلك', orders: 47, spend: 95000, status: 'active', joined: '2024-08-15' },
  { id: 'BUY-003', name: 'شركة التميمي', type: 'تاجر', orders: 210, spend: 1800000, status: 'active', joined: '2023-11-20' },
  { id: 'BUY-004', name: 'هايبر بنده', type: 'تاجر', orders: 620, spend: 8400000, status: 'active', joined: '2023-06-01' },
  { id: 'BUY-005', name: 'أبو سعد للتجارة', type: 'تاجر', orders: 12, spend: 34000, status: 'suspended', joined: '2026-01-10' },
]

// ── Support Tickets ───────────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low'

export const SUPPORT_TICKETS = [
  { id: 'TKT-4401', subject: 'طلب لم يصل بعد مرور 5 أيام', user: 'سوبرماركت الفيصل', priority: 'urgent' as TicketPriority, status: 'open' as TicketStatus, created: '2026-07-04 10:00' },
  { id: 'TKT-4400', subject: 'منتج تالف عند الاستلام', user: 'مطاعم الدرعية', priority: 'high' as TicketPriority, status: 'in_progress' as TicketStatus, created: '2026-07-04 08:30' },
  { id: 'TKT-4399', subject: 'استفسار عن الفاتورة الضريبية', user: 'شركة التميمي', priority: 'medium' as TicketPriority, status: 'resolved' as TicketStatus, created: '2026-07-03 14:00' },
  { id: 'TKT-4398', subject: 'خطأ في الكمية المستلمة', user: 'هايبر بنده', priority: 'high' as TicketPriority, status: 'open' as TicketStatus, created: '2026-07-03 11:20' },
  { id: 'TKT-4397', subject: 'طلب استرداد مدفوع', user: 'أبو سعد للتجارة', priority: 'low' as TicketPriority, status: 'closed' as TicketStatus, created: '2026-07-02 09:00' },
]

// ── Finance ───────────────────────────────────────────────────
export const PAYOUTS = [
  { id: 'PAY-2061', supplier: 'شركة النخيل للأغذية', amount: 84200, period: 'يونيو 2026', status: 'completed', date: '2026-07-01' },
  { id: 'PAY-2060', supplier: 'الخليج للمشروبات', amount: 41500, period: 'يونيو 2026', status: 'completed', date: '2026-07-01' },
  { id: 'PAY-2059', supplier: 'مورد الوادي', amount: 18700, period: 'يونيو 2026', status: 'pending', date: '2026-07-05' },
  { id: 'PAY-2058', supplier: 'شركة الحصاد', amount: 29400, period: 'يونيو 2026', status: 'pending', date: '2026-07-05' },
]

export const TRANSACTIONS = [
  { id: 'TXN-88210', type: 'sale', party: 'سوبرماركت الفيصل', amount: 12400, fee: 248, net: 12152, status: 'settled', date: '2026-07-04' },
  { id: 'TXN-88209', type: 'refund', party: 'أبو سعد للتجارة', amount: -1200, fee: 0, net: -1200, status: 'processed', date: '2026-07-04' },
  { id: 'TXN-88208', type: 'sale', party: 'مطاعم الدرعية', amount: 5800, fee: 116, net: 5684, status: 'settled', date: '2026-07-04' },
  { id: 'TXN-88207', type: 'payout', party: 'شركة النخيل للأغذية', amount: -84200, fee: 0, net: -84200, status: 'completed', date: '2026-07-01' },
]

// ── Roles & RBAC ──────────────────────────────────────────────
export const ADMIN_ROLES = [
  { id: 'ROLE-1', name: 'Super Admin', users: 2, permissions: 'all', description: 'صلاحيات كاملة بلا قيود' },
  { id: 'ROLE-2', name: 'Operations Manager', users: 5, permissions: 'orders,suppliers,buyers', description: 'إدارة العمليات اليومية' },
  { id: 'ROLE-3', name: 'Finance Officer', users: 3, permissions: 'finance,payouts,transactions', description: 'الشؤون المالية والمدفوعات' },
  { id: 'ROLE-4', name: 'Support Agent', users: 12, permissions: 'tickets,orders_read', description: 'خدمة العملاء والدعم' },
  { id: 'ROLE-5', name: 'Content Editor', users: 4, permissions: 'cms,catalog', description: 'إدارة المحتوى والكتالوج' },
]

export const PERMISSION_MATRIX = [
  { module: 'الطلبات', superAdmin: true, opsManager: true, finance: false, support: true, content: false },
  { module: 'الموردين', superAdmin: true, opsManager: true, finance: false, support: false, content: false },
  { module: 'المشترين', superAdmin: true, opsManager: true, finance: false, support: true, content: false },
  { module: 'المالية', superAdmin: true, opsManager: false, finance: true, support: false, content: false },
  { module: 'المحتوى', superAdmin: true, opsManager: false, finance: false, support: false, content: true },
  { module: 'الإعدادات', superAdmin: true, opsManager: false, finance: false, support: false, content: false },
  { module: 'التسويق', superAdmin: true, opsManager: true, finance: false, support: false, content: true },
  { module: 'التقارير', superAdmin: true, opsManager: true, finance: true, support: false, content: false },
]

// ── Audit Log ─────────────────────────────────────────────────
export const AUDIT_LOGS = [
  { id: 1, user: 'أحمد العمري', action: 'approved_supplier', target: 'شركة النخيل للأغذية', ip: '192.168.1.10', at: '2026-07-04 10:42' },
  { id: 2, user: 'سارة القحطاني', action: 'rejected_kyc', target: 'تاجر #BUY-005', ip: '192.168.1.22', at: '2026-07-04 10:30' },
  { id: 3, user: 'System', action: 'payout_run', target: 'PAY-2061', ip: 'system', at: '2026-07-04 06:00' },
  { id: 4, user: 'أحمد العمري', action: 'updated_config', target: 'feature_flags.ar', ip: '192.168.1.10', at: '2026-07-03 18:14' },
  { id: 5, user: 'فهد الشمري', action: 'deleted_product', target: 'منتج #PRD-8821', ip: '10.0.0.5', at: '2026-07-03 15:52' },
]

// ── Delivery Zones ────────────────────────────────────────────
export const DELIVERY_ZONES = [
  { id: 'ZN-001', name: 'الرياض — وسط المدينة', city: 'الرياض', fee: 25, minOrder: 500, status: 'active' },
  { id: 'ZN-002', name: 'الرياض — أطراف', city: 'الرياض', fee: 40, minOrder: 800, status: 'active' },
  { id: 'ZN-003', name: 'جدة — وسط', city: 'جدة', fee: 30, minOrder: 500, status: 'active' },
  { id: 'ZN-004', name: 'الدمام — المنطقة الشرقية', city: 'الدمام', fee: 50, minOrder: 1000, status: 'active' },
  { id: 'ZN-005', name: 'أبها — المنطقة الجنوبية', city: 'أبها', fee: 80, minOrder: 2000, status: 'inactive' },
]

// ── Countries config ──────────────────────────────────────────
export const ADMIN_COUNTRIES = [
  { code: 'SA', name: 'السعودية', currency: 'SAR', vat: '15%', enabled: true, languages: ['ar', 'en'] },
  { code: 'AE', name: 'الإمارات', currency: 'AED', vat: '5%', enabled: true, languages: ['ar', 'en'] },
  { code: 'KW', name: 'الكويت', currency: 'KWD', vat: '0%', enabled: true, languages: ['ar', 'en'] },
  { code: 'EG', name: 'مصر', currency: 'EGP', vat: '14%', enabled: false, languages: ['ar', 'en'] },
  { code: 'US', name: 'الولايات المتحدة', currency: 'USD', vat: 'N/A', enabled: false, languages: ['en'] },
]
