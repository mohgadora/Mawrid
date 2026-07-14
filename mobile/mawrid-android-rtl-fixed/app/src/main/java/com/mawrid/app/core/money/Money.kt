package com.mawrid.app.core.money

import java.text.NumberFormat
import java.util.Locale

/**
 * Money + currency formatting, mirrored from the web app's lib/config.ts.
 *
 * IMPORTANT: the backend stores and returns ALL prices in USD (the base
 * currency). Display currencies are derived by multiplying by the FX `rate`.
 * Consumer/retail prices additionally get RETAIL_MARKUP; merchants see raw
 * wholesale. The server remains authoritative for actual order totals.
 */
enum class Currency(val rate: Double, val symbolAr: String, val symbolEn: String, val decimals: Int) {
    USD(1.0, "$", "$", 2),
    SAR(3.75, "ر.س", "SAR", 2),
    AED(3.67, "د.إ", "AED", 2),
    KWD(0.31, "د.ك", "KWD", 3),
    EGP(48.0, "ج.م", "EGP", 2),
}

/** Retail (B2C) markup applied on top of the best wholesale price. */
const val RETAIL_MARKUP = 1.15

/** Free-shipping threshold and flat fee, in USD (matches web SHIPPING). */
const val SHIPPING_FREE_OVER_USD = 500.0
const val SHIPPING_FLAT_USD = 15.0

object Money {

    /**
     * When the signed-in user is a verified merchant they see raw wholesale
     * prices (no retail markup). Seeded at launch from [BuyerTypeStore] and
     * flipped by the buyer-type toggle. Plain flag (not reactive) — screens
     * composed after a change reflect it; already-visible prices update on the
     * next navigation.
     */
    @Volatile
    var merchantPricing: Boolean = false

    /** Apply the consumer retail markup to a wholesale USD price (skipped for merchants). */
    fun retailUsd(wholesaleUsd: Double): Double =
        if (merchantPricing) wholesaleUsd else wholesaleUsd * RETAIL_MARKUP

    /**
     * Format a USD amount into a display currency string.
     * @param amountUsd price in USD (as returned by the API)
     */
    /**
     * Format a USD amount into a display currency string.
     *
     * Always uses **Western Arabic numerals** (0–9) even in Arabic mode — the
     * Saudi market standard for prices. The old code used `Locale("ar","SA")`
     * which produced Eastern Arabic numerals (٠–٩).
     */
    fun format(amountUsd: Double, currency: Currency = Currency.SAR, isArabic: Boolean = true): String {
        val converted = amountUsd * currency.rate
        // Western numerals for prices regardless of language — Saudi convention.
        val nf = NumberFormat.getNumberInstance(Locale.US).apply {
            minimumFractionDigits = 0
            maximumFractionDigits = currency.decimals
        }
        val num = nf.format(converted)
        val symbol = if (isArabic) currency.symbolAr else currency.symbolEn
        return if (isArabic) "$num $symbol" else "$symbol$num"
    }
}
