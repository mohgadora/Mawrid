package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

// ─── KYC (GET/POST /api/v1/account/kyc) ────────────────────────────────────

/** GET → { data: { status, crNumber, vatNumber } }. status: none|pending|approved|rejected. */
@Serializable
data class KycStatusDto(
    val status: String = "none",
    val crNumber: String = "",
    val vatNumber: String = "",
)

/** POST body. `company` (اسم المنشأة) is required server-side. */
@Serializable
data class SubmitKycRequest(
    val company: String,
    val crNumber: String? = null,
    val vatNumber: String? = null,
)

// ─── Reorder templates (GET/POST /api/v1/account/templates) ────────────────

@Serializable
data class TemplateProductDto(
    val nameAr: String? = null,
    val nameEn: String? = null,
    val image: String? = null,
)

@Serializable
data class TemplateItemDto(
    val productId: String,
    val qty: Int = 1,
    val product: TemplateProductDto? = null,
)

@Serializable
data class ReorderTemplateDto(
    val id: String,
    val name: String = "",
    val items: List<TemplateItemDto> = emptyList(),
)

@Serializable
data class TemplateItemInput(val productId: String, val qty: Int)

/** POST body → saveReorderTemplate(name, items). */
@Serializable
data class SaveTemplateRequest(
    val name: String,
    val items: List<TemplateItemInput>,
)

// ─── Refunds / returns (GET/POST /api/v1/account/refunds) ──────────────────
// Numeric fields (orderTotal/refundAmount) arrive as strings — keep tolerant.

@Serializable
data class RefundDto(
    val id: String,
    val ref: String? = null,
    val orderId: String = "",
    val orderRef: String? = null,
    val orderTotal: String? = null,
    val reason: String = "",
    val notes: String? = null,
    val status: String = "pending",   // pending|approved|rejected|processed
    val refundAmount: String? = null,
    val createdAt: String? = null,
)

/** POST body. orderId + reason required; description optional. */
@Serializable
data class CreateRefundRequest(
    val orderId: String,
    val reason: String,
    val description: String? = null,
)
