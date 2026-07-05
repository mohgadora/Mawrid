/**
 * MapboxProvider — stub adapter for Mapbox GL JS.
 * Requires MAP.apiKeys.mapboxToken in lib/config.ts.
 * Falls back to LeafletProvider automatically when token is missing.
 *
 * To implement: load mapbox-gl, implement MapProvider using mapboxgl.Map,
 * mapboxgl.Marker, and GeoJSON source layers for routes.
 */

import type { MapProvider, LatLng, MarkerOptions, RouteOptions, MapEvent } from '@/lib/map-provider'

export class MapboxProvider implements MapProvider {
  constructor(private _token: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async init(_container: HTMLElement, _center: LatLng, _zoom: number) {
    throw new Error('MapboxProvider: not yet implemented — add mapbox-gl integration here')
  }
  setView(_c: LatLng, _z?: number) {}
  addMarker(_o: MarkerOptions) {}
  updateMarker(_o: MarkerOptions) {}
  removeMarker(_id: string) {}
  drawRoute(_o: RouteOptions) {}
  clearRoute() {}
  setTheme(_t: 'light' | 'dark') {}
  fitBounds(_p: LatLng[], _pad?: number) {}
  on(_e: MapEvent, _h: (id: string) => void) { return () => {} }
  destroy() {}
}
