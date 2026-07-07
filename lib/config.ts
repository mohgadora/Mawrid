/**
 * Central configuration. Rebranding, FX rates and retail markup all live here so
 * a change in one place propagates across the whole app.
 */

/** Single source of truth for the brand. Change these two lines to rebrand. */
export const BRAND = {
  ar: 'مورِد',
  en: 'Mawrid',
  /** Short logo mark shown in the square badge. */
  logoAr: 'م',
  logoEn: 'M',
} as const

export type CurrencyCode = 'SAR' | 'AED' | 'KWD' | 'USD' | 'EGP'

/**
 * FX rates relative to USD (the base currency used to store all prices) plus
 * locale-aware formatting metadata. `code` is the ISO 4217 code passed to
 * Intl.NumberFormat so decimals/grouping stay correct per currency.
 */
export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { rate: number; code: CurrencyCode; symbolAr: string; symbolEn: string; decimals: number }
> = {
  USD: { rate: 1, code: 'USD', symbolAr: '$', symbolEn: '$', decimals: 2 },
  SAR: { rate: 3.75, code: 'SAR', symbolAr: 'ر.س', symbolEn: 'SAR', decimals: 2 },
  AED: { rate: 3.67, code: 'AED', symbolAr: 'د.إ', symbolEn: 'AED', decimals: 2 },
  KWD: { rate: 0.31, code: 'KWD', symbolAr: 'د.ك', symbolEn: 'KWD', decimals: 3 },
  EGP: { rate: 48, code: 'EGP', symbolAr: 'ج.م', symbolEn: 'EGP', decimals: 2 },
}

/** User role layer. Guests/consumers see retail; verified merchants see wholesale. */
export type Role = 'guest' | 'consumer' | 'merchant'

/** Retail (B2C) markup applied on top of the best wholesale price. */
export const RETAIL_MARKUP = 1.15

/** Free-shipping threshold and flat fee, in USD. */
export const SHIPPING = { freeOverUsd: 500, flatUsd: 15 } as const

// ── Map configuration ──────────────────────────────────────────────────────
/**
 * Switching the active map engine is a one-line change here.
 * Providers needing an API key fall back to Leaflet when the key is absent.
 *
 * provider:   'leaflet'  — OpenStreetMap, free, no key, works immediately (DEFAULT)
 *             'google'   — Google Maps JS, requires googleMapsApiKey
 *             'mapbox'   — Mapbox GL, requires mapboxToken
 */
export type MapProviderName = 'leaflet' | 'google' | 'mapbox'

export const MAP = {
  /** Active provider — change this one value to swap engines. */
  provider: 'leaflet' as MapProviderName,

  /** API keys for providers that require them.  Leave empty to use Leaflet fallback. */
  apiKeys: {
    googleMapsApiKey: '',
    mapboxToken: '',
  },

  /** Saudi Arabia / UAE default center (Riyadh) */
  defaultCenter: { lat: 24.7136, lng: 46.6753 } as { lat: number; lng: number },
  defaultZoom: 12,

  /** Dark-mode tile URL for Leaflet (CartoDB Dark Matter — free, no key). */
  darkTiles: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  /** Light-mode tile URL for Leaflet. */
  lightTiles: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const
