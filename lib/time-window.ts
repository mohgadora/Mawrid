/**
 * lib/time-window.ts — pure active-window check (no I/O).
 * A null start means "already started"; a null expiry means "never expires".
 * Used by coupons, cashback rules, and wallet bonus rules.
 */
export function isWithinWindow(
  startsAt: Date | string | null | undefined,
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  const t = now.getTime()
  if (startsAt != null) {
    const s = new Date(startsAt).getTime()
    if (!Number.isNaN(s) && s > t) return false
  }
  if (expiresAt != null) {
    const e = new Date(expiresAt).getTime()
    if (!Number.isNaN(e) && e < t) return false
  }
  return true
}
