/**
 * lib/map-provider.ts
 *
 * MapProvider interface — the single abstraction all screens talk to.
 * Never import a concrete map library outside of adapters/*.
 * Swap engines by changing MAP.provider in lib/config.ts — zero screen changes.
 */

export type LatLng = { lat: number; lng: number }
export type MarkerOptions = {
  id: string
  position: LatLng
  /** CSS color string driven by design tokens */
  color: string
  /** Tooltip shown on hover */
  label: string
  /** Whether to animate a pulsing ring (e.g. for late drivers) */
  pulse?: boolean
}
export type RouteOptions = {
  /** Ordered waypoints: [pickup, ...waypoints, dropoff] */
  points: LatLng[]
  color?: string
}

export type MapEvent = 'markerClick' | 'markerHover'

export interface MapProvider {
  /** Mount the map into the given container element */
  init(container: HTMLElement, center: LatLng, zoom: number): void
  /** Pan + zoom to a position */
  setView(center: LatLng, zoom?: number): void
  /** Add a new driver marker */
  addMarker(options: MarkerOptions): void
  /** Move / re-color an existing marker */
  updateMarker(options: MarkerOptions): void
  /** Remove a marker by id */
  removeMarker(id: string): void
  /** Draw a polyline route (replaces any existing route) */
  drawRoute(options: RouteOptions): void
  /** Clear the drawn route */
  clearRoute(): void
  /** Switch tile/style between light and dark */
  setTheme(theme: 'light' | 'dark'): void
  /** Fit the viewport to show all given positions */
  fitBounds(positions: LatLng[], padding?: number): void
  /** Subscribe to map events — returns unsubscribe function */
  on(event: MapEvent, handler: (id: string) => void): () => void
  /** Tear down the map and release resources */
  destroy(): void
}

/** Factory — returns the active provider or falls back to Leaflet */
export async function createMapProvider(
  providerName: string,
  apiKeys: { googleMapsApiKey?: string; mapboxToken?: string },
): Promise<MapProvider> {
  if (providerName === 'google' && apiKeys.googleMapsApiKey) {
    const { GoogleProvider } = await import('@/lib/map-adapters/google-provider')
    return new GoogleProvider(apiKeys.googleMapsApiKey)
  }
  if (providerName === 'mapbox' && apiKeys.mapboxToken) {
    const { MapboxProvider } = await import('@/lib/map-adapters/mapbox-provider')
    return new MapboxProvider(apiKeys.mapboxToken)
  }
  // Default: Leaflet + OpenStreetMap — free, no key, works immediately
  const { LeafletProvider } = await import('@/lib/map-adapters/leaflet-provider')
  return new LeafletProvider()
}
