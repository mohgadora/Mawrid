/**
 * GoogleProvider — stub adapter for Google Maps JS API.
 * Requires MAP.apiKeys.googleMapsApiKey in lib/config.ts.
 * Falls back to LeafletProvider automatically when key is missing.
 *
 * To implement: load the Google Maps JS SDK, implement the MapProvider interface
 * using google.maps.Map, Marker, Polyline, etc.
 */

import type { MapProvider, LatLng, MarkerOptions, RouteOptions, MapEvent } from '@/lib/map-provider'

export class GoogleProvider implements MapProvider {
  constructor(private _apiKey: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async init(_container: HTMLElement, _center: LatLng, _zoom: number) {
    throw new Error('GoogleProvider: not yet implemented — add Google Maps JS SDK integration here')
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
