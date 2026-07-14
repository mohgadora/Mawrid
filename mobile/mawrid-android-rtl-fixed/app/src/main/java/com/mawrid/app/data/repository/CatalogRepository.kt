package com.mawrid.app.data.repository

import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.data.remote.dto.SubmitReviewRequest
import com.mawrid.app.domain.model.Category
import com.mawrid.app.domain.model.ProductReviews
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.SupplierWithProducts
import com.mawrid.app.domain.model.Variant
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Filters for GET /api/v1/products/search. Null fields are omitted from the
 * query. `sortBy` accepts: price_asc | price_desc | newest | rating | relevance.
 */
data class ProductSearchQuery(
    val q: String? = null,
    val category: String? = null,
    val supplier: String? = null,
    val minPrice: Double? = null,
    val maxPrice: Double? = null,
    val minRating: Double? = null,
    val inStock: Boolean? = null,
    val sortBy: String? = null,
    val page: Int = 1,
    val limit: Int = 24,
)

/** One page of search results, already mapped to domain products. */
data class ProductPage(
    val products: List<Product>,
    val total: Int,
    val page: Int,
    val totalPages: Int,
)

@Singleton
class CatalogRepository @Inject constructor(
    private val api: MawridApi,
    private val apiConfig: ApiConfig,
) {
    /** Featured/searched product list from GET /api/v1/products (unwraps { data }). */
    suspend fun products(query: String? = null): Result<List<Product>> = runCatching {
        val origin = origin()
        api.getProducts(query = query).data.map { it.toDomain(origin) }
    }

    /**
     * Single product. Prefers GET /api/v1/products/{id}, but that route 404s on
     * some deployments (e.g. the current VPS build), so we fall back to the list
     * endpoint — which returns full product objects (tiers, description, etc.)
     * — and match by id. If a deployment has the detail route, it's used as-is.
     */
    suspend fun product(id: String): Result<Product> = runCatching {
        val origin = origin()
        runCatching { api.getProduct(id).data.toDomain(origin) }
            .getOrElse {
                api.getProducts().data
                    .firstOrNull { it.id == id }
                    ?.toDomain(origin)
                    ?: throw NoSuchElementException("Product '$id' not found")
            }
    }

    /** Variants for a product from GET /api/v1/products/{id}/variants. */
    suspend fun variants(productId: String): Result<List<Variant>> = runCatching {
        api.getVariants(productId).data.map { it.toDomain() }
    }

    /** Reviews (aggregate + list) from GET /api/v1/products/{id}/reviews. */
    suspend fun reviews(productId: String): Result<ProductReviews> = runCatching {
        api.getReviews(productId).data.toDomain()
    }

    /** Post a review (requires auth). rating 1–5, body ≥ 10 chars. */
    suspend fun submitReview(productId: String, rating: Int, body: String, title: String?): Result<Unit> =
        runCatching {
            api.postReview(productId, SubmitReviewRequest(rating = rating, body = body.trim(), title = title?.trim()?.ifBlank { null }))
            Unit
        }

    /** Category list from GET /api/v1/categories. */
    suspend fun categories(): Result<List<Category>> = runCatching {
        val origin = origin()
        api.getCategories().data.map { it.toDomain(origin) }
    }

    /**
     * Products for a category via GET /api/v1/categories?slug=… — this endpoint
     * rolls up descendant categories (slug=food returns all food-subcategory
     * products), matching the website's category pages. Use this for category
     * browsing rather than search(category=), which is exact-slug and returns
     * nothing for parent categories no product is tagged to directly.
     */
    suspend fun categoryProducts(slug: String): Result<List<Product>> = runCatching {
        val origin = origin()
        api.getCategoryProducts(slug).data.products.map { it.toDomain(origin) }
    }

    /** Supplier storefront (info + products) from GET /api/v1/suppliers?slug={id}. */
    suspend fun supplier(id: String): Result<SupplierWithProducts> = runCatching {
        val origin = origin()
        val dto = api.getSupplier(id).data
        SupplierWithProducts(
            supplier = dto.supplier?.toDomain(origin),
            products = dto.products.map { it.toDomain(origin) },
        )
    }

    /** Filtered, paginated search from GET /api/v1/products/search. */
    suspend fun search(query: ProductSearchQuery): Result<ProductPage> = runCatching {
        val origin = origin()
        val resp = api.searchProducts(
            query = query.q?.takeIf { it.isNotBlank() },
            category = query.category,
            supplier = query.supplier,
            sortBy = query.sortBy,
            minPrice = query.minPrice,
            maxPrice = query.maxPrice,
            minRating = query.minRating,
            inStock = query.inStock,
            page = query.page,
            limit = query.limit,
        ).data
        ProductPage(
            products = resp.products.map { it.toDomain(origin) },
            total = resp.total,
            page = resp.page,
            totalPages = resp.totalPages,
        )
    }

    private suspend fun origin(): String = apiConfig.baseUrl().trimEnd('/')
}
