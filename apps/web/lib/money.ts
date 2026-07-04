/**
 * Decimal-safe money math. All catalog prices are stored as USD, but summing
 * floats (0.1 + 0.2 !== 0.3) drifts. Every total is computed in integer minor
 * units (cents) and only converted back to a USD number for display/formatting.
 *
 * Never do floating-point arithmetic on currency directly — route it through here.
 */

export type Cents = number

/** USD (possibly fractional) -> integer cents. */
export function toCents(usd: number): Cents {
  return Math.round(usd * 100)
}

/** Integer cents -> USD number (safe to pass to formatPrice). */
export function fromCents(cents: Cents): number {
  return cents / 100
}

/** unitPrice (USD) * whole quantity, in cents. Quantity is always an integer. */
export function lineTotalCents(unitUsd: number, qty: number): Cents {
  return toCents(unitUsd) * Math.max(0, Math.trunc(qty))
}

/** Sum a list of cent amounts. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0)
}

/** unitPrice (USD) * qty returned as a USD number, rounded safely. */
export function lineTotalUsd(unitUsd: number, qty: number): number {
  return fromCents(lineTotalCents(unitUsd, qty))
}
