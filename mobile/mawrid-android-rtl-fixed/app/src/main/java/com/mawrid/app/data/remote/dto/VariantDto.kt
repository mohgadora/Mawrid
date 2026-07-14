package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Variant DTO from GET /api/v1/products/{id}/variants (inside { data }).
 * Fields are nullable defensively; the price delta (if any) is a USD number.
 */
@Serializable
data class VariantDto(
    val id: String,
    val nameAr: String? = null,
    val nameEn: String? = null,
    val name: String? = null,
    val priceDelta: Double? = null,   // USD adjustment vs. base price
    val inStock: Boolean? = null,
)
