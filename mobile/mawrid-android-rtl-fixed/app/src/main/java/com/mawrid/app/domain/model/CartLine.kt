package com.mawrid.app.domain.model

import com.mawrid.app.domain.pricing.Pricing

/**
 * One line in the local cart: a product (+ optional variant) and a quantity in
 * cartons. Prices are display *estimates* computed from catalog tiers — the
 * server recomputes the authoritative total at checkout.
 */
data class CartLine(
    val product: Product,
    val variant: Variant?,
    val qty: Int,
) {
    /** Stable identity: same product + same variant collapses into one line. */
    val key: String get() = product.id + "#" + (variant?.id ?: "")

    /** Wholesale USD per carton at this quantity's tier, plus any variant delta. */
    val unitPriceUsd: Double
        get() = Pricing.unitPriceUsd(product, qty) + (variant?.priceDeltaUsd ?: 0.0)

    val lineTotalUsd: Double get() = unitPriceUsd * qty

    /** Estimated savings vs. market price for the whole line. */
    val lineSavingsUsd: Double get() = Pricing.savingsPerCartonUsd(product, qty) * qty
}
