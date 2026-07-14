package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

// ─── Blog (GET /v1/blog, /v1/blog/{slug}) ──────────────────────────────────

@Serializable
data class BlogListItemDto(
    val id: String = "",
    val slug: String = "",
    val titleAr: String? = null,
    val titleEn: String? = null,
    val excerptAr: String? = null,
    val coverImage: String? = null,
    val publishedAt: String? = null,
    val viewCount: Int = 0,
)

@Serializable
data class BlogPostDto(
    val id: String = "",
    val slug: String = "",
    val titleAr: String? = null,
    val titleEn: String? = null,
    val bodyAr: String? = null,
    val bodyEn: String? = null,
    val coverImage: String? = null,
    val publishedAt: String? = null,
    val viewCount: Int = 0,
)

// ─── Deal of the day (GET /v1/deals/today → data may be null) ──────────────

@Serializable
data class DealDto(
    val id: String = "",
    val productId: String = "",
    val titleAr: String? = null,
    val titleEn: String? = null,
    val productName: String? = null,
    val image: String? = null,
    val basePrice: Double = 0.0,
    val salePrice: Double = 0.0,
    val discount: Double = 0.0,
)

// ─── Clearance (GET /v1/clearance) ─────────────────────────────────────────

@Serializable
data class ClearanceProductDto(
    val productId: String = "",
    val name: String = "",
    val image: String? = null,
    val discountPercent: Double = 0.0,
    val basePrice: Double = 0.0,
    val salePrice: Double = 0.0,
)

@Serializable
data class ClearanceDto(
    val id: String = "",
    val titleAr: String? = null,
    val titleEn: String? = null,
    val endsAt: String? = null,
    val products: List<ClearanceProductDto> = emptyList(),
)

// ─── Flash sales (GET /v1/flash-sales/active) ──────────────────────────────

@Serializable
data class FlashSaleDto(
    val id: String = "",
    val titleAr: String? = null,
    val titleEn: String? = null,
    val startsAt: String? = null,
    val endsAt: String? = null,
)
