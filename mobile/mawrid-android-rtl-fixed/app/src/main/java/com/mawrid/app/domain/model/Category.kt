package com.mawrid.app.domain.model

/**
 * A catalog category. `slug` is the stable key used to filter products
 * (products/search?category=<slug>). Names come bilingually from the API.
 */
data class Category(
    val slug: String,
    val nameAr: String,
    val nameEn: String,
    val imageUrl: String?,
    val productCount: Int?,
    /** Non-null on child categories; null identifies a top-level category. */
    val parentSlug: String? = null,
) {
    val isTopLevel: Boolean get() = parentSlug.isNullOrBlank()

    fun displayName(isArabic: Boolean): String =
        if (isArabic) nameAr.ifBlank { nameEn } else nameEn.ifBlank { nameAr }
}
