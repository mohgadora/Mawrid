package com.mawrid.app.domain.pricing

import com.mawrid.app.domain.model.PriceTier
import com.mawrid.app.domain.model.Product

/**
 * Framework-free wholesale pricing logic (KMP-ready). This mirrors how the web
 * app resolves a quantity to a tier price; the server remains authoritative for
 * the actual charged total, so this is only for *display* estimates.
 *
 * All amounts are USD. Consumer retail markup and FX conversion happen later,
 * in core/money/Money — do not mix them in here.
 */
object Pricing {

    /**
     * The wholesale price-per-carton (USD) that applies at [qty], picking the
     * highest tier whose [PriceTier.minQty] the quantity satisfies. Falls back
     * to the product's [Product.basePriceUsd] when no tiers are present.
     */
    fun unitPriceUsd(product: Product, qty: Int): Double {
        val applicable = product.tiers
            .filter { qty >= it.minQty }
            .maxByOrNull { it.minQty }
        return applicable?.pricePerCartonUsd ?: product.basePriceUsd
    }

    /** Line subtotal (USD) for [qty] cartons at the applicable tier price. */
    fun lineTotalUsd(product: Product, qty: Int): Double =
        unitPriceUsd(product, qty) * qty

    /**
     * Per-carton savings (USD) versus the average market retail price, or 0 when
     * there's no market price to compare against or wholesale isn't cheaper.
     */
    fun savingsPerCartonUsd(product: Product, qty: Int): Double {
        val market = product.marketPriceUsd ?: return 0.0
        val wholesale = unitPriceUsd(product, qty)
        return (market - wholesale).coerceAtLeast(0.0)
    }

    /** Savings expressed as a 0..100 percentage off the market price. */
    fun savingsPercent(product: Product, qty: Int): Int {
        val market = product.marketPriceUsd ?: return 0
        if (market <= 0.0) return 0
        return ((savingsPerCartonUsd(product, qty) / market) * 100).toInt()
    }
}
