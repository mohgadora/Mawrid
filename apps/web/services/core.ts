/**
 * Service layer core.
 *
 * Every screen reads data through `services/*` instead of importing `lib/data`
 * directly. Today these functions resolve from the in-memory mock catalog and a
 * localStorage-backed store, but because they are all async with typed return
 * values, swapping them for real `fetch` calls to an API is a one-file change
 * per service — the UI (which consumes them via SWR) never changes.
 */

/**
 * Resolves service data. In production the artificial latency is removed so data
 * resolves near-instantly (combined with SWR caching, revisits feel immediate).
 * In development a tiny delay is kept so loading skeletons remain exercisable —
 * capped well below the original values and disableable via NEXT_PUBLIC_NO_DELAY.
 */
const DEV_DELAY_MS =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_NO_DELAY !== '1'
    ? 120
    : 0

export function delay<T>(value: T, ms = 320): Promise<T> {
  const effective = DEV_DELAY_MS === 0 ? 0 : Math.min(ms, DEV_DELAY_MS)
  if (effective <= 0) return Promise.resolve(value)
  return new Promise((resolve) => setTimeout(() => resolve(value), effective))
}

/** Deep clone so callers can never mutate the mock "database" in place. */
export function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T)
}

const isBrowser = typeof window !== 'undefined'

/** Read a JSON value from the localStorage-backed mock store. */
export function readStore<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Persist a JSON value to the localStorage-backed mock store. */
export function writeStore<T>(key: string, value: T): void {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / serialization errors in the demo store */
  }
}

/** Stable id generator for mock records. */
export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
