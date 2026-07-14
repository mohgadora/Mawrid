package com.mawrid.app.domain.model

/** A single product review. */
data class Review(
    val id: String,
    val authorName: String,
    val rating: Int,
    val title: String,
    val body: String,
    val helpfulCount: Int,
    val verified: Boolean,
    val createdAtIso: String,
)

/** How many reviews sit at each star level (for the ratings bar chart). */
data class RatingBucket(val stars: Int, val count: Int, val pct: Int)

/** Aggregate reviews payload for a product. */
data class ProductReviews(
    val averageRating: Double,
    val totalCount: Int,
    val distribution: List<RatingBucket>,
    val reviews: List<Review>,
) {
    companion object {
        val EMPTY = ProductReviews(0.0, 0, emptyList(), emptyList())
    }
}
