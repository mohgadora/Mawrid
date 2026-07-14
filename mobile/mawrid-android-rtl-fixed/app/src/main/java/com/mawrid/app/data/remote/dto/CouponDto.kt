package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * A publicly-listed coupon card (GET /api/v1/coupons). Numeric fields come back
 * as strings (Postgres numeric), so keep them String and parse for display.
 */
@Serializable
data class CouponDto(
    val id: String? = null,
    val code: String = "",
    val type: String = "percentage",   // percentage | fixed | free_shipping
    val value: String = "0",
    val minOrderAmount: String? = null,
    val titleAr: String? = null,
    val descriptionAr: String? = null,
)

/**
 * POST /api/v1/coupons/validate body. The server re-prices from productId/qty
 * (never trusts a client-sent price), so we send only the cart lines.
 */
@Serializable
data class CouponValidateRequest(
    val code: String,
    val items: List<OrderLineRequest>,
)

/** POST /api/v1/coupons/validate → { data: { valid, message, discountUsd, freeShipping, code, type } }. */
@Serializable
data class CouponValidateResultDto(
    val valid: Boolean = false,
    val message: String? = null,
    val discountUsd: Double = 0.0,
    val freeShipping: Boolean = false,
    val code: String? = null,
    val type: String? = null,
)

/** POST /api/v1/cashback/preview body. */
@Serializable
data class CashbackPreviewRequest(
    val items: List<OrderLineRequest>,
)

/** POST /api/v1/cashback/preview → { data: { cashbackUsd } }. */
@Serializable
data class CashbackResultDto(
    val cashbackUsd: Double = 0.0,
)
