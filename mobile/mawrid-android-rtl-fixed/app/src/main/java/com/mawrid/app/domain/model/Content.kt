package com.mawrid.app.domain.model

// ─── Blog ────────────────────────────────────────────────────────────────────

data class BlogSummary(
    val slug: String,
    val title: String,
    val excerpt: String?,
    val imageUrl: String?,
    val publishedAtIso: String?,
)

data class BlogPost(
    val slug: String,
    val title: String,
    val body: String,
    val imageUrl: String?,
    val publishedAtIso: String?,
)

// ─── Deals / clearance / flash ───────────────────────────────────────────────

/** Deal of the day (or null when none active). Prices are USD. */
data class Deal(
    val id: String,
    val title: String,
    val productId: String,
    val productName: String,
    val imageUrl: String?,
    val basePriceUsd: Double,
    val salePriceUsd: Double,
)

/** A single clearance item flattened for a simple grid. */
data class ClearanceItem(
    val productId: String,
    val name: String,
    val imageUrl: String?,
    val discountPercent: Int,
    val salePriceUsd: Double,
)

data class FlashSale(
    val id: String,
    val title: String,
    val endsAtIso: String?,
)
