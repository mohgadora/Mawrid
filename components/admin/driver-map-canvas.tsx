'use client'

/**
 * MapCanvas — mounts and manages the active MapProvider.
 *
 * This component owns the imperative provider lifecycle:
 *   init → addMarker/updateMarker per driver → drawRoute on selection → destroy.
 *
 * It is dynamically imported with { ssr: false } in the page so Leaflet's
 * `window` dependency never runs on the server.
 */

import { useEffect, useRef, useCallback } from 'react'
import { createMapProvider } from '@/lib/map-provider'
import type { MapProvider, LatLng } from '@/lib/map-provider'
import type { Driver, DriverStatus } from '@/services/driver-tracking'
import { MAP } from '@/lib/config'

/**
 * Tailwind bg utility class for each status — used in React UI (dots, badges,
 * chips, legend) so dark-mode adaptation happens via CSS without any hex.
 */
export const STATUS_TAILWIND: Record<DriverStatus, string> = {
  available: 'bg-success',
  busy:      'bg-amber-500',
  late:      'bg-destructive',
  returning: 'bg-blue-500',
  offline:   'bg-gray-400',
  break:     'bg-orange-500',
}

/**
 * Resolve a color string suitable for Leaflet's imperative SVG/HTML marker API.
 * Reads `--success` and `--destructive` from the live computed style so the
 * map markers honour the active theme token values; the remaining statuses use
 * stable Tailwind-palette values that don't shift between light and dark.
 */
function resolveStatusColor(status: DriverStatus): string {
  if (typeof window === 'undefined') {
    // SSR fallback — these are never rendered server-side but satisfy TS
    const fallbacks: Record<DriverStatus, string> = {
      available: '#22c55e', busy: '#f59e0b', late: '#ef4444',
      returning: '#3b82f6', offline: '#9ca3af', break: '#f97316',
    }
    return fallbacks[status]
  }
  const style = getComputedStyle(document.documentElement)
  switch (status) {
    case 'available': return `oklch(${style.getPropertyValue('--success').trim()})`
    case 'late':      return `oklch(${style.getPropertyValue('--destructive').trim()})`
    case 'busy':      return '#f59e0b'  // amber-400 — same in light + dark
    case 'returning': return '#3b82f6'  // blue-500
    case 'offline':   return '#9ca3af'  // gray-400
    case 'break':     return '#f97316'  // orange-500
  }
}

/**
 * Returns a fresh color string for each status call, resolving CSS tokens live.
 * Use this for Leaflet marker / route colors; use STATUS_TAILWIND for React UI.
 */
export function getStatusColor(status: DriverStatus): string {
  return resolveStatusColor(status)
}

type Props = {
  drivers: Driver[]
  selectedId: string | null
  theme: 'light' | 'dark'
  onSelectDriver: (id: string) => void
}

export default function MapCanvas({ drivers, selectedId, theme, onSelectDriver }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const providerRef  = useRef<MapProvider | null>(null)
  const initialised  = useRef(false)

  // Boot the provider once on mount
  useEffect(() => {
    if (!containerRef.current || initialised.current) return
    initialised.current = true

    let cancelled = false
    createMapProvider(MAP.provider, MAP.apiKeys).then((p) => {
      if (cancelled || !containerRef.current) return
      providerRef.current = p
      p.init(containerRef.current, MAP.defaultCenter, MAP.defaultZoom)
      p.setTheme(theme)

      // Listen for marker clicks and sync to parent
      p.on('markerClick', onSelectDriver)

      // Add all markers
      drivers.forEach((d) => {
        p.addMarker({
          id:       d.id,
          position: { lat: d.lat, lng: d.lng },
          color:    getStatusColor(d.status),
          label:    d.name,
          pulse:    d.status === 'late',
        })
      })

      // Fit to all driver positions
      if (drivers.length > 0) {
        p.fitBounds(
          drivers.map((d) => ({ lat: d.lat, lng: d.lng })),
          40,
        )
      }
    })

    return () => {
      cancelled = true
      providerRef.current?.destroy()
      providerRef.current = null
      initialised.current = false
    }
  // Only run on mount — driver updates are handled by the next effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync marker positions on every live-update tick
  useEffect(() => {
    const p = providerRef.current
    if (!p) return
    drivers.forEach((d) => {
      p.updateMarker({
        id:       d.id,
        position: { lat: d.lat, lng: d.lng },
        color:    getStatusColor(d.status),
        label:    d.name,
        pulse:    d.status === 'late',
      })
    })
  }, [drivers])

  // Sync light/dark tile layer
  useEffect(() => {
    providerRef.current?.setTheme(theme)
  }, [theme])

  // Draw/clear route on selection change
  useEffect(() => {
    const p = providerRef.current
    if (!p) return
    if (!selectedId) { p.clearRoute(); return }

    const driver = drivers.find((d) => d.id === selectedId)
    if (!driver || driver.route.length < 2) { p.clearRoute(); return }

    p.drawRoute({ points: driver.route as LatLng[], color: getStatusColor(driver.status) })
    p.setView({ lat: driver.lat, lng: driver.lng }, 14)
  }, [selectedId, drivers])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Driver tracking map"
      role="application"
    />
  )
}
