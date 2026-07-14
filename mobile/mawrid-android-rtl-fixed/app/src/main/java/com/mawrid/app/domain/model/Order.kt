package com.mawrid.app.domain.model

/**
 * Order status lifecycle (matches the backend). An order can be cancelled only
 * before it ships.
 */
enum class OrderStatus(val apiValue: String, val labelAr: String) {
    PENDING("pending", "قيد الانتظار"),
    CONFIRMED("confirmed", "مؤكد"),
    PROCESSING("processing", "قيد التجهيز"),
    PACKED("packed", "تم التغليف"),
    SHIPPED("shipped", "تم الشحن"),
    OUT_FOR_DELIVERY("out_for_delivery", "قيد التوصيل"),
    DELIVERED("delivered", "تم التوصيل"),
    CANCELLED("cancelled", "ملغي"),
    UNKNOWN("", "غير معروف");

    /** Cancellable until it ships. */
    val isCancellable: Boolean
        get() = this == PENDING || this == CONFIRMED || this == PROCESSING || this == PACKED

    /** Refundable once fulfilment is underway (matches the server's allow-list). */
    val isRefundable: Boolean
        get() = this == PROCESSING || this == SHIPPED || this == OUT_FOR_DELIVERY || this == DELIVERED

    companion object {
        fun from(value: String?): OrderStatus =
            entries.firstOrNull { it.apiValue == value } ?: UNKNOWN
    }
}

/**
 * A placed order. All money is FINAL USD (the server already applied the
 * consumer markup and confirmed shipping); the UI only FX-converts, never
 * re-applies the retail markup.
 */
data class Order(
    val id: String,
    val ref: String,
    val createdAtIso: String?,
    val status: OrderStatus,
    val timeline: List<OrderEvent>,
    val lines: List<OrderLine>,
    val subtotalUsd: Double,
    val shippingUsd: Double,
    val savingsUsd: Double,
    val totalUsd: Double,
    val address: OrderAddress?,
    val deliverySlotAr: String,
    val deliverySlotEn: String,
    val paymentMethod: String,
    val paymentStatus: String,
) {
    fun deliverySlot(isArabic: Boolean): String =
        if (isArabic) deliverySlotAr.ifBlank { deliverySlotEn } else deliverySlotEn.ifBlank { deliverySlotAr }
}

data class OrderEvent(
    val status: OrderStatus,
    val atIso: String?,
)

data class OrderLine(
    val productId: String,
    val name: String,
    val imageUrl: String?,
    val qty: Int,
    val unitPriceUsd: Double,
) {
    val lineTotalUsd: Double get() = unitPriceUsd * qty
}

data class OrderAddress(
    val label: String,
    val line1: String,
    val city: String,
    val phone: String,
)
