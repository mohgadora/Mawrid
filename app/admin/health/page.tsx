'use client'

import { useState } from 'react'
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AdminEntityManager, statusChip } from '@/components/admin/admin-entity-manager'
import { useToast } from '@/lib/toast'

type ServiceStatus = 'operational' | 'degraded' | 'down'

type Service = {
  id: number
  name: string
  status: ServiceStatus
  latency: number
  uptime: number
  group: string
}

type Incident = {
  id: number
  title: string
  service: string
  status: string
  date: string
}

const SERVICES: Service[] = [
  { id: 1, name: 'API Gateway', status: 'operational', latency: 42, uptime: 99.98, group: 'البنية الأساسية' },
  { id: 2, name: 'قاعدة البيانات الرئيسية', status: 'operational', latency: 8, uptime: 99.99, group: 'البنية الأساسية' },
  { id: 3, name: 'Redis Cache', status: 'operational', latency: 2, uptime: 99.99, group: 'البنية الأساسية' },
  { id: 4, name: 'File Storage (CDN)', status: 'operational', latency: 65, uptime: 99.95, group: 'البنية الأساسية' },
  { id: 5, name: 'نظام البحث', status: 'degraded', latency: 320, uptime: 98.1, group: 'الخدمات' },
  { id: 6, name: 'إشعارات Push', status: 'operational', latency: 180, uptime: 99.80, group: 'الخدمات' },
  { id: 7, name: 'AI Recommendations', status: 'operational', latency: 890, uptime: 99.50, group: 'الخدمات' },
  { id: 8, name: 'بوابة الدفع (Mada)', status: 'operational', latency: 210, uptime: 99.90, group: 'المدفوعات' },
  { id: 9, name: 'بوابة الدفع (Visa/MC)', status: 'operational', latency: 195, uptime: 99.92, group: 'المدفوعات' },
  { id: 10, name: 'Apple Pay', status: 'down', latency: 0, uptime: 97.2, group: 'المدفوعات' },
]

const INCIDENTS: Incident[] = [
  { id: 1, title: 'بطء في نظام البحث', service: 'نظام البحث', status: 'in_progress', date: '2026-07-04' },
  { id: 2, title: 'انقطاع Apple Pay', service: 'Apple Pay', status: 'open', date: '2026-07-04' },
]

const STATUS_META: Record<ServiceStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  operational: { icon: CheckCircle2, color: 'text-primary', label: 'يعمل' },
  degraded: { icon: AlertCircle, color: 'text-yellow-500', label: 'بطيء' },
  down: { icon: XCircle, color: 'text-destructive', label: 'متوقف' },
}

const INCIDENT_STATUS_OPTIONS = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد المعالجة' },
  { value: 'resolved', label: 'محلول' },
]

const groups = [...new Set(SERVICES.map((s) => s.group))]

export default function HealthPage() {
  const { success } = useToast()
  const [lastCheck, setLastCheck] = useState('منذ 30 ثانية')
  const [refreshing, setRefreshing] = useState(false)

  const operational = SERVICES.filter((s) => s.status === 'operational').length
  const total = SERVICES.length

  function refresh() {
    setRefreshing(true)
    setTimeout(() => {
      setLastCheck('الآن')
      setRefreshing(false)
      success('تم تحديث حالة النظام')
    }, 600)
  }

  return (
    <div className="space-y-6 route-fade">
      <div className={`flex items-center gap-4 rounded-xl p-4 ${
        operational === total
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <Activity className={`size-8 shrink-0 ${operational === total ? 'text-primary' : 'text-yellow-600'}`} />
        <div className="flex-1">
          <p className={`text-sm font-bold ${operational === total ? 'text-primary' : 'text-yellow-700'}`}>
            {operational === total ? 'جميع الخدمات تعمل بشكل طبيعي' : `${total - operational} خدمة تحتاج انتباهاً`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">آخر فحص: {lastCheck}</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs shrink-0" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} /> تحديث
        </Button>
      </div>

      {groups.map((group) => {
        const groupServices = SERVICES.filter((s) => s.group === group)
        return (
          <div key={group} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group}</h2>
            </div>
            <div className="divide-y divide-border/50">
              {groupServices.map((svc) => {
                const meta = STATUS_META[svc.status] ?? { icon: AlertCircle, color: 'text-muted-foreground', label: String(svc.status) }
                const Icon = meta.icon
                return (
                  <div key={svc.id} className="flex items-center gap-4 px-5 py-3.5">
                    <Icon className={`size-4 shrink-0 ${meta.color}`} />
                    <p className="flex-1 text-sm font-medium text-foreground">{svc.name}</p>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{svc.status === 'down' ? '—' : `${svc.latency}ms`}</p>
                        <p className="text-[10px]">زمن الاستجابة</p>
                      </div>
                      <div className="w-28">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px]">Uptime</span>
                          <span className={`text-[10px] font-semibold ${svc.uptime >= 99.9 ? 'text-primary' : svc.uptime >= 98 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {svc.uptime}%
                          </span>
                        </div>
                        <Progress value={svc.uptime} className="h-1.5" />
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      svc.status === 'operational'
                        ? 'bg-primary/10 text-primary'
                        : svc.status === 'degraded'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">سجل الحوادث</p>
        <AdminEntityManager<Incident>
          storageKey="admin-health-incidents"
          initial={INCIDENTS}
          addLabel="حادثة جديدة"
          editLabel="تعديل الحادثة"
          emptyForm={{ title: '', service: '', status: 'open', date: '' }}
          columns={[
            { key: 'title', label: 'الحادثة' },
            { key: 'service', label: 'الخدمة' },
            { key: 'date', label: 'التاريخ' },
            { key: 'status', label: 'الحالة', render: (r) => statusChip(r.status) },
          ]}
          fields={[
            { key: 'title', label: 'عنوان الحادثة', required: true },
            { key: 'service', label: 'الخدمة المتأثرة', required: true },
            { key: 'date', label: 'التاريخ', dir: 'ltr' },
            { key: 'status', label: 'الحالة', type: 'select', options: INCIDENT_STATUS_OPTIONS },
          ]}
        />
      </div>
    </div>
  )
}
