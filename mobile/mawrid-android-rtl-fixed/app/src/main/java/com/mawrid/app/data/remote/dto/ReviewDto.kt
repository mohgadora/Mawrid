package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** One product review from GET /api/v1/products/{id}/reviews. */
@Serializable
data class ReviewDto(
    val id: String,
    val authorName: String? = null,
    val rating: Int = 0,
    val title: String? = null,
    val body: String? = null,
    val helpfulCount: Int = 0,
    val verified: Boolean = false,
    val createdAt: String? = null,
)

@Serializable
data class RatingBucketDto(val stars: Int = 0, val count: Int = 0, val pct: Int = 0)

/** GET /api/v1/products/{id}/reviews → { data: {...} }. */
@Serializable
data class ReviewsResponseDto(
    val averageRating: Double = 0.0,
    val totalCount: Int = 0,
    val distribution: List<RatingBucketDto> = emptyList(),
    val reviews: List<ReviewDto> = emptyList(),
    val userHelpfulIds: List<String> = emptyList(),
)

/** POST body: rating 1–5, body ≥10 chars, optional title. */
@Serializable
data class SubmitReviewRequest(
    val rating: Int,
    val body: String,
    val title: String? = null,
)
