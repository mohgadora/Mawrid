package com.mawrid.app.domain.model

/** A supplier/store shown on its storefront page. */
data class Supplier(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val verified: Boolean,
    val rating: Double,
    val logoUrl: String?,
    val descriptionAr: String,
    val descriptionEn: String,
    val cityAr: String,
    val cityEn: String,
    /** Founding year, if known; drives the "years active" stat. */
    val since: Int?,
    val followerCount: Int,
) {
    fun displayName(isArabic: Boolean): String =
        if (isArabic) nameAr.ifBlank { nameEn } else nameEn.ifBlank { nameAr }

    fun displayCity(isArabic: Boolean): String =
        if (isArabic) cityAr.ifBlank { cityEn } else cityEn.ifBlank { cityAr }

    fun displayDescription(isArabic: Boolean): String =
        if (isArabic) descriptionAr.ifBlank { descriptionEn } else descriptionEn.ifBlank { descriptionAr }
}

/** Supplier storefront payload: the supplier plus its products. */
data class SupplierWithProducts(
    val supplier: Supplier?,
    val products: List<Product>,
)
