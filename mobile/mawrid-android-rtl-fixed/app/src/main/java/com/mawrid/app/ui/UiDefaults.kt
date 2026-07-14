package com.mawrid.app.ui

import com.mawrid.app.core.money.Currency
import com.mawrid.app.core.money.Money

/**
 * App-wide presentation defaults. Phase 4 will make language/currency a real
 * user setting (DataStore) and thread it through the UI; for now every screen
 * reads these constants so pricing/locale stay consistent in one place.
 */
object UiDefaults {
    /** Default language is Arabic (RTL), matching the website. */
    const val IS_ARABIC = true

    /** Default display currency for the storefront. */
    val DISPLAY_CURRENCY = Currency.SAR

    /**
     * Format a **wholesale/catalog** USD price for the consumer: applies the
     * retail markup, then converts to the display currency. Use for product,
     * cart and catalog prices.
     */
    fun formatRetail(wholesaleUsd: Double): String =
        Money.format(Money.retailUsd(wholesaleUsd), DISPLAY_CURRENCY, IS_ARABIC)

    /**
     * Format a **final** USD amount (order/checkout totals the server already
     * priced) — FX conversion only, NO markup. Never pass catalog prices here.
     */
    fun formatFinal(usd: Double): String =
        Money.format(usd, DISPLAY_CURRENCY, IS_ARABIC)
}
