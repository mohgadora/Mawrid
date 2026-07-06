/**
 * lib/order-totals.ts — pure order total arithmetic (cents-safe, no I/O).
 * One place to compute subtotal/total so create-order and edit-order agree.
 */
import { toCents, fromCents, sumCents } from '@/lib/money'

/**
 * Given each line's subtotal (USD), the shipping fee and any discount, returns
 * the order subtotal and grand total in USD. Total is floored at zero.
 */
export function orderTotals(
  lineSubtotalsUsd: number[],
  shippingUsd = 0,
  discountUsd = 0,
): { subtotalUsd: number; totalUsd: number } {
  const subtotalCents = sumCents(lineSubtotalsUsd.map((s) => toCents(s)))
  const totalCents = Math.max(0, subtotalCents + toCents(shippingUsd) - toCents(discountUsd))
  return { subtotalUsd: fromCents(subtotalCents), totalUsd: fromCents(totalCents) }
}
