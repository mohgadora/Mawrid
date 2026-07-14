package com.mawrid.app.domain.model

/**
 * Result of validating a coupon against the current cart (server-authoritative).
 * [discountUsd] is a wholesale-USD discount; [freeShipping] waives the flat fee.
 */
data class CouponValidation(
    val valid: Boolean,
    val message: String?,
    val code: String,
    val discountUsd: Double,
    val freeShipping: Boolean,
    val type: String?,
)
