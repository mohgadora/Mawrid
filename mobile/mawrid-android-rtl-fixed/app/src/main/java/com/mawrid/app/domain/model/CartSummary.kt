package com.mawrid.app.domain.model

import com.mawrid.app.core.money.Money
import com.mawrid.app.core.money.SHIPPING_FLAT_USD
import com.mawrid.app.core.money.SHIPPING_FREE_OVER_USD

/**
 * Cart totals (display estimate). The server confirms the real shipping and
 * total at checkout, so this is only a preview.
 *
 * Money model, all in USD: [subtotalUsd] and [savingsUsd] are *wholesale* catalog
 * amounts — the consumer retail markup is applied when they're formatted (via
 * `formatRetail`). [shippingUsd] is a flat delivery fee that must NOT be marked
 * up (format it with `formatFinal`). [totalUsd] is already the consumer-facing
 * total — retail(subtotal) + shipping — so format it with `formatFinal` too.
 */
data class CartSummary(
    val subtotalUsd: Double,
    val savingsUsd: Double,
    val shippingUsd: Double,
    val totalUsd: Double,
    val itemCount: Int,
) {
    companion object {
        val EMPTY = CartSummary(0.0, 0.0, 0.0, 0.0, 0)

        fun from(lines: List<CartLine>): CartSummary {
            if (lines.isEmpty()) return EMPTY
            val subtotal = lines.sumOf { it.lineTotalUsd }
            val savings = lines.sumOf { it.lineSavingsUsd }
            // Free-shipping threshold compares the consumer (retail) subtotal —
            // that's the amount the buyer actually sees toward the $500 free bar.
            val retailSubtotal = Money.retailUsd(subtotal)
            val shipping = if (retailSubtotal >= SHIPPING_FREE_OVER_USD) 0.0 else SHIPPING_FLAT_USD
            return CartSummary(
                subtotalUsd = subtotal,
                savingsUsd = savings,
                shippingUsd = shipping,
                totalUsd = retailSubtotal + shipping,
                itemCount = lines.sumOf { it.qty },
            )
        }
    }
}
