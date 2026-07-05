'use client'

/**
 * /admin/drivers/map — Live Driver Tracking Map
 *
 * Architecture:
 *  - MapCanvas is dynamically imported with { ssr: false } to keep Leaflet's
 *    `window` references off the server entirely.
 *  - All map engine code lives behind the MapProvider interface; swapping
 *    engines is a single line in lib/config.ts (MAP.provider).
 *  - Live positions are simulated by calling refreshDriverPositions() on a
 *    5-second interval. Replace with a WebSocket/SSE feed in production.
 *  - Four states: loading skeleton / success / empty / error (via AsyncContent).
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import {
  Users, UserCheck, Clock, AlertTriangle, Radio,
} from 'lucide-react'
import { fetchAdminDrivers } from '@/lib/api-client'
import type { Driver, DriverStatus } from '@/services/driver-tracking'
import { MAP } from '@/lib/config'

function mapDbDriver(row: Awaited<ReturnType<typeof fetchAdminDrivers>>[number]): Driver {
  const statusMap: Record<string, DriverStatus> = {
    offline: 'offline',
    online: 'available',
    busy: 'busy',
    delivering: 'busy',
  }
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicle: row.vehicle,
    vehiclePlate: row.vehiclePlate ?? '',
    city: (row as { city?: string | null }).city ?? null,
    lat: Number(row.lat ?? MAP.defaultCenter.lat),
    lng: Number(row.lng ?? MAP.defaultCenter.lng),
    status: statusMap[row.status ?? 'offline'] ?? 'offline',
    currentOrderId: row.currentOrderId ?? null,
    etaMinutes: null,
    lateByMinutes: null,
    lastUpdated: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? new Date().toISOString()),
    route: [],
  }
}
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { AsyncContent } from '@/components/async-content'
import { AdminPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/admin/stat-card'
import { DriverPanel } from '@/components/admin/driver-panel'
import { STATUS_TAILWIND } from '@/components/admin/driver-map-canvas'

// ── Dynamic import — SSR disabled so Leaflet never runs on the server ─────────
const MapCanvas = dynamic(
  () => import('@/components/admin/driver-map-canvas'),
  {
    ssr: false,
    // Shown while the Leaflet bundle chunk loads
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    ),
  },
)

// ── Leaflet CSS — injected once in the browser via a link element ─────────────
function useLeafletCss() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'leaflet-css'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }, [])
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriverMapPage() {
  const { t } = useI18n()
  const { theme } = useTheme()
  useLeafletCss()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [cityFilter, setCityFilter] = useState<string>('all')

  const { data, error, isLoading, mutate } = useSWR(
    ['admin/drivers', isLive],
    async () => {
      const rows = await fetchAdminDrivers()
      return rows.map(mapDbDriver)
    },
    { revalidateOnFocus: true, refreshInterval: isLive ? 15_000 : 0 },
  )

  const allDrivers = data ?? []
  const cities = Array.from(new Set(allDrivers.map((d) => d.city).filter(Boolean))) as string[]
  const drivers = cityFilter === 'all' ? allDrivers : allDrivers.filter((d) => d.city === cityFilter)

  // ── Stat helpers ─────────────────────────────────────────────────────────
  const count = (status: DriverStatus) => drivers.filter((d) => d.status === status).length
  const availableCount = count('available')
  const busyCount      = count('busy') + count('returning')
  const lateCount      = count('late')

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden route-fade">

      {/* ── Stat strip ─────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-3 p-4 pb-0 sm:grid-cols-4">
        <StatCard
          label={t('driverTotal')}
          value={drivers.length}
          icon={Users}
        />
        <StatCard
          label={t('driverAvailableCount')}
          value={availableCount}
          icon={UserCheck}
        />
        <StatCard
          label={t('driverBusyCount')}
          value={busyCount}
          icon={Clock}
        />
        <StatCard
          label={t('driverLateCount')}
          value={lateCount}
          icon={AlertTriangle}
          className={lateCount > 0 ? 'border-destructive/40 bg-destructive/5' : ''}
        />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-foreground">{t('driverMap')}</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {MAP.provider}
          </span>
        </div>

        {/* City filter */}
        {cities.length > 0 && (
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-7 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">كل المدن</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Live toggle */}
        <button
          type="button"
          onClick={() => setIsLive((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            isLive
              ? 'bg-success/15 text-success'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
          aria-pressed={isLive}
          aria-label={t('liveTracking')}
        >
          <Radio className={`size-3 ${isLive ? 'animate-pulse' : ''}`} aria-hidden />
          {t('liveTracking')}
        </button>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pb-3">
        {(Object.keys(STATUS_TAILWIND) as DriverStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className={`size-2.5 shrink-0 rounded-full ${STATUS_TAILWIND[status]}`}
              aria-hidden
            />
            <span className="text-[10px] text-muted-foreground">
              {t(STATUS_LABEL_KEY[status])}
            </span>
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground/60 ms-auto italic">
          {t('mapProviderNote')}
        </span>
      </div>

      {/* ── Main: panel + map ───────────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden border-t border-border">
        <AsyncContent
          data={data}
          error={error}
          isLoading={isLoading}
          loading={<AdminPageSkeleton rows={0} cards={4} />}
          isEmpty={(d) => !d?.length}
          empty={
            <EmptyState
              icon={Users}
              title={t('noDriversFound')}
            />
          }
          onRetry={() => mutate()}
        >
          {(_initialDrivers) => (
            /* Once data loaded, render panel + map side by side.
               Live state is managed in `drivers` — _initialDrivers seeds it via useEffect above. */
            <div className="flex h-full w-full overflow-hidden">
              {/* Side panel — logical start side (RTL-correct: end side in Arabic) */}
              <DriverPanel
                drivers={drivers}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onStatusChange={() => mutate()}
              />

              {/* Map canvas fills remaining space */}
              <div className="relative flex-1 overflow-hidden">
                <MapCanvas
                  drivers={drivers}
                  selectedId={selectedId}
                  theme={theme}
                  onSelectDriver={(id) =>
                    setSelectedId((prev) => (prev === id ? null : id))
                  }
                />

                {/* No-route hint */}
                {!selectedId && (
                  <div className="pointer-events-none absolute bottom-4 start-1/2 -translate-x-1/2 rounded-xl border border-border bg-card/90 px-3 py-1.5 text-center text-xs text-muted-foreground shadow backdrop-blur-sm">
                    {t('selectDriverToRoute')}
                  </div>
                )}
              </div>
            </div>
          )}
        </AsyncContent>
      </div>
    </div>
  )
}

// ── Status → i18n key lookup (type-safe) ──────────────────────────────────────
const STATUS_LABEL_KEY: Record<DriverStatus, Parameters<ReturnType<typeof useI18n>['t']>[0]> = {
  available: 'driverStatusAvailable',
  busy:      'driverStatusBusy',
  late:      'driverStatusLate',
  returning: 'driverStatusReturning',
  offline:   'driverStatusOffline',
  break:     'driverStatusBreak',
}
