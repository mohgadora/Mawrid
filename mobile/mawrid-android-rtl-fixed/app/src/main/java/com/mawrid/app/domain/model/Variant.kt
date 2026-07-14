package com.mawrid.app.domain.model

/**
 * A selectable product variant (e.g. size / color / packaging). Optional
 * `priceDeltaUsd` adjusts the base wholesale price when this variant is chosen;
 * the server stays authoritative for the final charged price at checkout.
 */
data class Variant(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val priceDeltaUsd: Double,
    val inStock: Boolean,
) {
    fun displayName(isArabic: Boolean): String =
        if (isArabic) nameAr.ifBlank { nameEn } else nameEn.ifBlank { nameAr }
}
