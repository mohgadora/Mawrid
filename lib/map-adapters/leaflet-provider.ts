/**
 * LeafletProvider — concrete implementation of MapProvider using Leaflet + OSM.
 * Free, no API key required, works immediately in any environment.
 * This file is dynamically imported only in the browser via createMapProvider().
 */

import type { MapProvider, LatLng, MarkerOptions, RouteOptions, MapEvent } from '@/lib/map-provider'
import { MAP } from '@/lib/config'

// Leaflet is loaded at runtime to avoid SSR issues (no `window`).
// We type it via the @types/leaflet package.
import type L from 'leaflet'

type LType = typeof L

/** Build a colored SVG circle marker as a Leaflet DivIcon */
function buildIcon(lf: LType, color: string, pulse: boolean): L.DivIcon {
  const size = 28
  const pulseStyle = pulse
    ? `animation: driver-pulse 1.8s ease-in-out infinite;`
    : ''

  return lf.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        position:relative;
        width:${size}px;
        height:${size}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${pulse ? `<div style="
          position:absolute;
          inset:0;
          border-radius:50%;
          background:${color};
          opacity:0.35;
          ${pulseStyle}
        "></div>` : ''}
        <div style="
          width:${size - 6}px;
          height:${size - 6}px;
          border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          ${pulseStyle}
        "></div>
      </div>`,
  })
}

export class LeafletProvider implements MapProvider {
  private lf!: LType
  private map!: L.Map
  private tileLayer!: L.TileLayer
  private markers = new Map<string, L.Marker>()
  private routeLine: L.Polyline | null = null
  private theme: 'light' | 'dark' = 'light'
  private listeners = new Map<MapEvent, Set<(id: string) => void>>()

  async init(container: HTMLElement, center: LatLng, zoom: number) {
    // Dynamic import prevents SSR window errors
    this.lf = (await import('leaflet')).default

    // Fix Leaflet's default marker icon paths broken by bundlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this.lf.Icon.Default.prototype as any)._getIconUrl
    this.lf.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    this.map = this.lf.map(container, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: true,
    })

    this.lf.control.zoom({ position: 'bottomright' }).addTo(this.map)

    this.tileLayer = this.lf
      .tileLayer(MAP.lightTiles, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      })
      .addTo(this.map)
  }

  setView(center: LatLng, zoom?: number) {
    this.map.setView([center.lat, center.lng], zoom ?? this.map.getZoom())
  }

  addMarker(opts: MarkerOptions) {
    const icon = buildIcon(this.lf, opts.color, !!opts.pulse)
    const marker = this.lf
      .marker([opts.position.lat, opts.position.lng], { icon, title: opts.label })
      .addTo(this.map)

    marker.on('click', () => this._emit('markerClick', opts.id))
    marker.on('mouseover', () => this._emit('markerHover', opts.id))

    this.markers.set(opts.id, marker)
  }

  updateMarker(opts: MarkerOptions) {
    const m = this.markers.get(opts.id)
    if (!m) { this.addMarker(opts); return }
    m.setLatLng([opts.position.lat, opts.position.lng])
    m.setIcon(buildIcon(this.lf, opts.color, !!opts.pulse))
  }

  removeMarker(id: string) {
    const m = this.markers.get(id)
    if (m) { m.remove(); this.markers.delete(id) }
  }

  drawRoute(opts: RouteOptions) {
    this.clearRoute()
    const latlngs = opts.points.map((p) => [p.lat, p.lng] as [number, number])
    this.routeLine = this.lf
      .polyline(latlngs, {
        color: opts.color ?? '#3b82f6',
        weight: 4,
        opacity: 0.85,
        dashArray: '10 6',
      })
      .addTo(this.map)
  }

  clearRoute() {
    if (this.routeLine) { this.routeLine.remove(); this.routeLine = null }
  }

  setTheme(theme: 'light' | 'dark') {
    if (this.theme === theme) return
    this.theme = theme
    this.tileLayer.setUrl(theme === 'dark' ? MAP.darkTiles : MAP.lightTiles)
  }

  fitBounds(positions: LatLng[], padding = 60) {
    if (!positions.length) return
    const bounds = this.lf.latLngBounds(positions.map((p) => [p.lat, p.lng]))
    this.map.fitBounds(bounds, { padding: [padding, padding] })
  }

  on(event: MapEvent, handler: (id: string) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
    return () => this.listeners.get(event)?.delete(handler)
  }

  destroy() {
    this.map?.remove()
    this.markers.clear()
    this.listeners.clear()
  }

  private _emit(event: MapEvent, id: string) {
    this.listeners.get(event)?.forEach((h) => h(id))
  }
}
