package com.mawrid.app.domain.model

// ─── KYC ─────────────────────────────────────────────────────────────────────

/** Merchant KYC state. [status] ∈ none | pending | approved | rejected. */
data class KycStatus(
    val status: String,
    val crNumber: String,
    val vatNumber: String,
) {
    val submitted: Boolean get() = status != "none"

    companion object {
        val NONE = KycStatus("none", "", "")
    }
}

// ─── Reorder templates ───────────────────────────────────────────────────────

data class TemplateItem(
    val productId: String,
    val qty: Int,
    val name: String,
    val imageUrl: String?,
)

data class ReorderTemplate(
    val id: String,
    val name: String,
    val items: List<TemplateItem>,
) {
    val totalCartons: Int get() = items.sumOf { it.qty }
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

data class RefundRequest(
    val id: String,
    val ref: String?,
    val orderRef: String?,
    val reason: String,
    val notes: String?,
    val status: String,          // pending|approved|rejected|processed
    val createdAtIso: String?,
)
