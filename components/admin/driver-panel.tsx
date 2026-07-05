'use client'

/**
 * DriverPanel — collapsible list panel showing all drivers with
 * status color coding, search, filter chips, and detail drawer.
 * Fully bilingual (useI18n) and RTL-correct (logical properties only).
 */

import { useState } from 'react'
import { Search, X, ChevronLeft, ChevronRight, Phone, Truck, Clock, AlertTriangle, Package, CheckCircle, XCircle, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Driver, DriverStatus } from '@/services/driver-tracking'
import { STATUS_TAILWIND } from '@/components/admin/driver-map-canvas'

/** i18n key for each driver status */
const STATUS_KEY: Record<DriverStatus, Parameters<ReturnType<typeof useI18n>['t']>[0]> = {
  available: 'driverStatusAvailable',
  busy:      'driverStatusBusy',
  late:      'driverStatusLate',
  returning: 'driverStatusReturning',
  offline:   'driverStatusOffline',
  break:     'driverStatusBreak',
}

const ALL_STATUSES: Array<DriverStatus | 'all'> = [
  'all', 'available', 'busy', 'late', 'returning', 'offline', 'break',
]

type Props = {
  drivers: Driver[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStatusChange?: () => void
}

export function DriverPanel({ drivers, selectedId, onSelect, onStatusChange }: Props) {
  const { t, lang } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all')

  const isRtl = lang === 'ar'

  const filtered = drivers.filter((d) => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchQ      = !q || d.name.includes(q) || d.id.toLowerCase().includes(q.toLowerCase())
    return matchStatus && matchQ
  })

  const selected = drivers.find((d) => d.id === selectedId) ?? null

  // Collapse toggle icon — mirrors for RTL
  const CollapseIcon = isRtl
    ? (collapsed ? ChevronLeft  : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft)

  return (
    <div
      className={cn(
        'relative flex h-full shrink-0 flex-col border-e border-border bg-card transition-all duration-300',
        collapsed ? 'w-0 overflow-hidden border-0' : 'w-72',
      )}
    >
      {/* Collapse toggle tab — sits outside the panel width so it's always visible */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? t('driversPanel') : t('close')}
        className={cn(
          'absolute top-1/2 z-10 -translate-y-1/2 flex size-6 items-center justify-center rounded-e-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent transition-colors',
          isRtl ? '-left-6' : '-right-6',
        )}
      >
        <CollapseIcon className="size-3.5" />
      </button>

      {!collapsed && (
        <>
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{t('driversPanel')}</span>
            <span className="text-xs text-muted-foreground">{filtered.length} / {drivers.length}</span>
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('driverSearchPlaceholder')}
                className="h-8 ps-8 text-xs"
                aria-label={t('driverSearchPlaceholder')}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t('close')}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {ALL_STATUSES.map((s) => {
              const count = s === 'all'
                ? drivers.length
                : drivers.filter((d) => d.status === s).length
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors border',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent',
                  )}
                >
                  {s !== 'all' && (
                    <span
                      className={`size-1.5 rounded-full shrink-0 ${STATUS_TAILWIND[s]}`}
                      aria-hidden
                    />
                  )}
                  {s === 'all' ? t('filterAll') : t(STATUS_KEY[s])}
                  <span className={cn('rounded-full px-1', active ? 'bg-white/20' : 'bg-muted')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Driver list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">{t('noDriversFound')}</p>
            ) : (
              <ul role="listbox" aria-label={t('driversPanel')}>
                {filtered.map((d) => (
                  <DriverRow
                    key={d.id}
                    driver={d}
                    selected={d.id === selectedId}
                    onSelect={() => onSelect(d.id === selectedId ? null : d.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Detail drawer — slides up from bottom of panel */}
      {selected && !collapsed && (
        <DriverDetail
          driver={selected}
          onClose={() => onSelect(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  )
}

// ── Driver row ────────────────────────────────────────────────────────────────

function DriverRow({
  driver,
  selected,
  onSelect,
}: {
  driver: Driver
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useI18n()
  const statusLabel = t(STATUS_KEY[driver.status] ?? 'driverStatusOffline')

  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors',
          selected ? 'bg-primary/10' : 'hover:bg-accent',
          driver.status === 'late' && !selected && 'border-s-2 border-destructive',
        )}
      >
        {/* Status dot */}
        <span
          className={`mt-0.5 size-2.5 shrink-0 rounded-full ${STATUS_TAILWIND[driver.status] ?? 'bg-muted-foreground'}`}
          aria-label={statusLabel}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-foreground">{driver.name}</span>
            {driver.status === 'late' && (
              <AlertTriangle className="size-3 shrink-0 text-destructive" aria-label={t('driverStatusLate')} />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white ${STATUS_TAILWIND[driver.status] ?? 'bg-muted-foreground'}`}
            >
              {statusLabel}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">{driver.id}</span>
          </div>
          {driver.lateByMinutes != null && (
            <p className="mt-0.5 text-[10px] font-medium text-destructive">
              {t('driverLateBy')} {driver.lateByMinutes} {t('lateByMinutes')}
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

// ── Driver detail drawer ──────────────────────────────────────────────────────

function DriverDetail({ driver, onClose, onStatusChange }: { driver: Driver; onClose: () => void; onStatusChange?: () => void }) {
  const { t } = useI18n()
  const { error: toastError } = useToast()
  const [updating, setUpdating] = useState(false)

  async function changeStatus(status: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/v1/admin/drivers/${driver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await res.text())
      onStatusChange?.()
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const rows: Array<{ icon: React.ElementType; label: string; value: string }> = [
    { icon: Phone,   label: t('driverPhone'),        value: driver.phone },
    { icon: Truck,   label: t('driverVehicle'),      value: `${driver.vehicle} · ${driver.vehiclePlate}` },
    { icon: Package, label: t('driverCurrentOrder'), value: driver.currentOrderId ?? t('driverNoOrder') },
    ...(driver.etaMinutes != null
      ? [{ icon: Clock, label: t('driverEta'), value: `${driver.etaMinutes} ${t('lateByMinutes')}` }]
      : []),
    ...(driver.lateByMinutes != null
      ? [{ icon: AlertTriangle, label: t('driverLateBy'), value: `${driver.lateByMinutes} ${t('lateByMinutes')}` }]
      : []),
  ]

  // Format last-updated relative time
  const lastUpdatedMs  = new Date(driver.lastUpdated).getTime()
  const secondsAgo     = Math.round((Date.now() - lastUpdatedMs) / 1000)
  const lastUpdatedStr = secondsAgo < 60
    ? `${secondsAgo}s`
    : `${Math.round(secondsAgo / 60)}m`

  return (
    <div className="border-t border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 shrink-0 rounded-full ${STATUS_TAILWIND[driver.status] ?? 'bg-muted-foreground'}`}
              aria-hidden
            />
            <p className="text-sm font-bold text-foreground">{driver.name}</p>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t('driverLastUpdated')}: {lastUpdatedStr}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <ul className="space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-2 text-xs">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <span className="text-muted-foreground">{label}: </span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          </li>
        ))}
      </ul>

      {driver.route.length >= 2 && (
        <p className="mt-3 text-[10px] text-primary">{t('selectDriverToRoute')}</p>
      )}

      <div className="mt-3 flex gap-1.5 flex-wrap">
        {driver.status !== 'available' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] text-green-600 border-green-300" disabled={updating} onClick={() => changeStatus('online')}>
            <CheckCircle className="size-3" /> تفعيل
          </Button>
        )}
        {driver.status !== 'offline' && (
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] text-muted-foreground" disabled={updating} onClick={() => changeStatus('offline')}>
            <WifiOff className="size-3" /> إيقاف
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px] text-red-600 border-red-300" disabled={updating} onClick={() => changeStatus('suspended')}>
          <XCircle className="size-3" /> تعليق
        </Button>
      </div>
    </div>
  )
}
