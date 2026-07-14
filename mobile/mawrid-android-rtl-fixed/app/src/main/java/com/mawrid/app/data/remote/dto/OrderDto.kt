package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

// ── Request ───────────────────────────────────────────────────────────────

/**
 * Create-order payload. IMPORTANT: send only productId/qty/variantId — the
 * server is price-authoritative and ignores any client price. Address uses
 * `line1` (not `street`); paymentMethod ∈ cod | card | bank.
 */
@Serializable
data class CreateOrderRequest(
    val lines: List<OrderLineRequest>,
    val address: OrderAddressRequest,
    val paymentMethod: String,
    val couponCode: String? = null,
)

@Serializable
data class OrderLineRequest(
    val productId: String,
    val qty: Int,
    val variantId: String? = null,
)

@Serializable
data class OrderAddressRequest(
    val label: String,
    val line1: String,
    val city: String,
    val phone: String,
)

// ── Response ──────────────────────────────────────────────────────────────

/** All money fields are FINAL USD (server already applied consumer markup). */
@Serializable
data class OrderDto(
    val id: String,
    val ref: String? = null,
    val createdAt: String? = null,
    val status: String? = null,
    val timeline: List<TimelineEventDto> = emptyList(),
    val lines: List<OrderLineDto> = emptyList(),
    val subtotalUsd: Double = 0.0,
    val shippingUsd: Double = 0.0,
    val savingsUsd: Double = 0.0,
    val totalUsd: Double = 0.0,
    val totalCents: Long = 0,
    val address: OrderAddressDto? = null,
    val deliverySlotAr: String? = null,
    val deliverySlotEn: String? = null,
    val paymentMethod: String? = null,
    val paymentStatus: String? = null,
)

@Serializable
data class TimelineEventDto(
    val status: String,
    val at: String? = null,
)

@Serializable
data class OrderLineDto(
    val productId: String? = null,
    val productName: String? = null,
    val productImage: String? = null,
    val qty: Int = 0,
    val unitPrice: Double = 0.0,
)

@Serializable
data class OrderAddressDto(
    val label: String? = null,
    val line1: String? = null,
    val city: String? = null,
    val phone: String? = null,
)

/** Cancel endpoint returns just `{ cancelled: true }`, not the full order. */
@Serializable
data class CancelResultDto(
    val cancelled: Boolean = false,
)
