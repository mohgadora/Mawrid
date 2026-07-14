package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Product DTO — mirrors the shape returned by GET /api/v1/products, which the
 * backend produces via services/catalog.mapProduct(). Confirmed fields:
 *   nameAr, nameEn, image (relative path), basePrice (USD number, best tier),
 *   marketPrice (USD number), moq, rating, tiers[{minQty, pricePerCarton}],
 *   supplierAr/En (currently empty from the list endpoint), categorySlug.
 *
 * Money arrives as JSON numbers in USD (not strings). Nullable defensively so an
 * unexpected/absent key won't crash deserialization.
 */
@Serializable
data class ProductDto(
    val id: String,
    val nameAr: String? = null,
    val nameEn: String? = null,
    val name: String? = null,               // fallback single-name field
    val supplierAr: String? = null,
    val supplierEn: String? = null,
    val supplierId: String? = null,
    val image: String? = null,              // relative path, e.g. "/products/rice.png"
    val imageUrl: String? = null,           // alt key, defensive
    val basePrice: Double? = null,          // USD, best (highest-qty) tier price
    val oldPrice: Double? = null,
    val marketPrice: Double? = null,        // USD, avg market retail per carton
    val rating: Double? = null,
    val moq: Int? = null,
    val unitsPerCarton: Int? = null,
    val verified: Boolean? = null,
    val categorySlug: String? = null,
    val descriptionAr: String? = null,
    val descriptionEn: String? = null,
    val tiers: List<PriceTierDto> = emptyList(),
)

@Serializable
data class PriceTierDto(
    val minQty: Int,
    val pricePerCarton: Double,             // USD wholesale per carton
)

/** Paginated shape returned by GET /api/v1/products/search (inside { data }). */
@Serializable
data class ProductSearchResponse(
    val products: List<ProductDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val totalPages: Int = 1,
)

/**
 * Shape returned by GET /api/v1/categories?slug={slug} (inside { data }): the
 * matched category plus its products. Unlike products/search?category= (which
 * does an exact-slug match), this endpoint rolls up descendant categories — e.g.
 * slug=food returns products of dairy/grains/oils/… — matching the website's
 * category pages. Products reuse the standard ProductDto shape.
 */
@Serializable
data class CategoryProductsResponse(
    val category: CategoryDto? = null,
    val products: List<ProductDto> = emptyList(),
)
