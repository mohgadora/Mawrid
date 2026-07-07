'use client'

import { AdminEntityManager } from '@/components/admin/admin-entity-manager'

type LogEntry = {
  id: number
  level: string
  service: string
  message: string
  at: string
}

const INITIAL: LogEntry[] = [
  { id: 1, level: 'error', service: 'payment-gateway', message: 'Apple Pay: connection timeout after 30s — OrderID: ORD-10042', at: '2026-07-04 11:04:33' },
  { id: 2, level: 'warn', service: 'search-engine', message: 'Query latency exceeded 300ms threshold: "ارز بسمتي"', at: '2026-07-04 10:58:12' },
  { id: 3, level: 'info', service: 'order-service', message: 'Order ORD-10041 status updated: confirmed → shipped', at: '2026-07-04 10:45:00' },
  { id: 4, level: 'info', service: 'auth-service', message: 'Admin login: ahmed.omari@mourrid.sa from 192.168.1.10', at: '2026-07-04 10:40:22' },
  { id: 5, level: 'error', service: 'recommendation-ai', message: 'Gateway timeout: model inference > 5s — userId: USR-8821', at: '2026-07-04 10:35:07' },
  { id: 6, level: 'info', service: 'notification-service', message: 'Push sent to 1,240 devices — campaign: ramadan_offer_2026', at: '2026-07-04 10:30:00' },
  { id: 7, level: 'debug', service: 'catalog-service', message: 'Cache miss for category slug: grains — revalidating', at: '2026-07-04 10:28:44' },
  { id: 8, level: 'warn', service: 'rate-limiter', message: 'IP 185.220.101.x exceeded 100 req/min — temporarily blocked', at: '2026-07-04 10:20:18' },
  { id: 9, level: 'info', service: 'finance-service', message: 'Payout PAY-2061 processed: 84,200 SAR → شركة النخيل', at: '2026-07-04 06:00:00' },
  { id: 10, level: 'debug', service: 'cdn', message: 'Cache purge for /products/rice-premium.png completed', at: '2026-07-04 05:55:30' },
]

const LEVEL_OPTIONS = [
  { value: 'error', label: 'ERROR' },
  { value: 'warn', label: 'WARN' },
  { value: 'info', label: 'INFO' },
  { value: 'debug', label: 'DEBUG' },
]

export default function LogsPage() {
  return (
    <AdminEntityManager<LogEntry>
      storageKey="admin-logs"
      initial={INITIAL}
      addLabel="إضافة سجل"
      editLabel="تعديل السجل"
      emptyForm={{ level: 'info', service: '', message: '', at: '' }}
      columns={[
        { key: 'at', label: 'الوقت' },
        { key: 'level', label: 'المستوى', render: (r) => r.level.toUpperCase() },
        { key: 'service', label: 'الخدمة' },
        { key: 'message', label: 'الرسالة' },
      ]}
      fields={[
        { key: 'level', label: 'المستوى', type: 'select', options: LEVEL_OPTIONS },
        { key: 'service', label: 'الخدمة', required: true, dir: 'ltr' },
        { key: 'message', label: 'الرسالة', type: 'textarea', required: true },
        { key: 'at', label: 'الوقت', dir: 'ltr' },
      ]}
    />
  )
}
