package com.mawrid.app.domain.model

/**
 * Domain model — UI-facing, framework-free (KMP-ready).
 *
 * All money is in USD (the backend's base currency). Convert to a display
 * currency and apply retail markup only at the presentation layer via
 * core/money/Money. The server stays authoritative for final order totals.
 *
 * `tiers`, `descriptionAr/En` and `unitsPerCarton` are populated by the detail
 * endpoint; the list endpoint may leave descriptions blank and (sometimes) omit
 * tiers, so treat them defensively in the UI.
 */
data class Product(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val supplierAr: String,
    val supplierEn: String,
    val supplierId: String?,
    /** Absolute image URL (relative API paths are resolved against the base URL). */
    val imageUrl: String?,
    /** Best (highest-qty) wholesale tier price, USD. */
    val basePriceUsd: Double,
    val oldPriceUsd: Double?,
    /** Average market retail price, USD — used for the savings comparison. */
    val marketPriceUsd: Double?,
    val rating: Double,
    val moq: Int,
    val verified: Boolean,
    val categorySlug: String?,
    /** Quantity-break pricing, cheapest-per-carton last. */
    val tiers: List<PriceTier> = emptyList(),
    val unitsPerCarton: Int? = null,
    val descriptionAr: String = "",
    val descriptionEn: String = "",
) {
    fun displayName(isArabic: Boolean): String =
        if (isArabic) nameAr.ifBlank { nameEn } else nameEn.ifBlank { nameAr }

    fun displaySupplier(isArabic: Boolean): String =
        if (isArabic) supplierAr.ifBlank { supplierEn } else supplierEn.ifBlank { supplierAr }

    fun displayDescription(isArabic: Boolean): String =
        if (isArabic) descriptionAr.ifBlank { descriptionEn } else descriptionEn.ifBlank { descriptionAr }
}
