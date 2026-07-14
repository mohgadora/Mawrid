package com.mawrid.app.domain.model

// ─── Loyalty ───────────────────────────────────────────────────────────────

/** A single loyalty ledger entry. [points] is negative for redemptions. */
data class LoyaltyEntry(
    val id: String,
    val type: String,
    val points: Int,
    val balanceAfter: Int,
    val note: String?,
    val createdAtIso: String?,
)

/** Loyalty account summary + recent ledger. */
data class Loyalty(
    val balance: Int,
    val lifetimeEarned: Int,
    val lifetimeRedeemed: Int,
    val entries: List<LoyaltyEntry>,
) {
    companion object {
        val EMPTY = Loyalty(0, 0, 0, emptyList())
    }
}

// ─── Referral ────────────────────────────────────────────────────────────────

/** One person the user referred. */
data class ReferralEntry(
    val id: String,
    val status: String,       // pending | rewarded
    val referrerBonus: Int,
    val createdAtIso: String?,
)

/** The user's referral code, how many times it was used, and who they referred. */
data class Referral(
    val code: String,
    val usageCount: Int,
    val entries: List<ReferralEntry>,
) {
    companion object {
        val EMPTY = Referral("", 0, emptyList())
    }
}
