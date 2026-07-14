package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** Supplier record from GET /api/v1/suppliers (list) and ?slug={id} (detail). */
@Serializable
data class SupplierDto(
    val id: String,
    val nameAr: String? = null,
    val nameEn: String? = null,
    val verified: Boolean? = null,
    val rating: Double? = null,
    val logo: String? = null,
    val descriptionAr: String? = null,
    val descriptionEn: String? = null,
    val cityAr: String? = null,
    val cityEn: String? = null,
    val since: Int? = null,
    val followerCount: Int? = null,
)

/** GET /api/v1/suppliers?slug={id} → { data: { supplier, products } }. */
@Serializable
data class SupplierDetailDto(
    val supplier: SupplierDto? = null,
    val products: List<ProductDto> = emptyList(),
)

/** GET/POST/DELETE /api/v1/shops/{id}/follow → { data: { following } }. */
@Serializable
data class FollowStateDto(
    val following: Boolean = false,
)
