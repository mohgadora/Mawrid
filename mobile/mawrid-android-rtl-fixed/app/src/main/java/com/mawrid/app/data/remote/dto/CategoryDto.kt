package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Category DTO from GET /api/v1/categories (inside { data } as an array).
 * With ?slug= the endpoint returns { category, products } — see
 * CategoryProductsResponse and CatalogRepository.categoryProducts.
 *
 * `parentSlug` is present only on child categories (it holds the parent's id, a
 * UUID — not a slug, so it can't be resolved back to a parent from this list).
 * Its absence is what identifies a top-level category, which is all the buyer UI
 * needs: the categories screen shows only top-level categories, mirroring the
 * website (food/beverages/snacks/cleaning), and each rolls up its children.
 */
@Serializable
data class CategoryDto(
    val slug: String,
    val nameAr: String? = null,
    val nameEn: String? = null,
    val name: String? = null,
    val image: String? = null,
    val imageUrl: String? = null,
    val productCount: Int? = null,
    val count: Int? = null,
    val parentSlug: String? = null,
)
