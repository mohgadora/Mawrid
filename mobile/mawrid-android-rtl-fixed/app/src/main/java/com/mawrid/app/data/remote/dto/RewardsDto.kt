package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

// ─── Loyalty (GET /api/v1/account/loyalty) ────────────────────────────────
// Points are plain integers (see loyalty_transaction/loyalty_account schema).

@Serializable
data class LoyaltyAccountDto(
    val balance: Int = 0,
    val lifetimeEarned: Int = 0,
    val lifetimeRedeemed: Int = 0,
    val updatedAt: String? = null,
)

@Serializable
data class LoyaltyTransactionDto(
    val id: String,
    val orderId: String? = null,
    val type: String = "",            // earn | redeem | adjust
    val points: Int = 0,              // negative for redeem
    val balanceAfter: Int = 0,
    val note: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class LoyaltyResponseDto(
    val account: LoyaltyAccountDto = LoyaltyAccountDto(),
    val transactions: List<LoyaltyTransactionDto> = emptyList(),
)

/** POST /api/v1/account/loyalty/redeem body. Server requires points ≥ 1. */
@Serializable
data class RedeemPointsRequest(val points: Int)

/** POST /api/v1/account/loyalty/redeem → { data: { balance, transactionId } }. */
@Serializable
data class RedeemResultDto(
    val balance: Int = 0,
    val transactionId: String? = null,
)

// ─── Referral (GET /api/v1/account/referral) ──────────────────────────────

@Serializable
data class ReferralRowDto(
    val id: String,
    val refereeId: String? = null,
    val status: String = "pending",   // pending | rewarded
    val referrerBonus: Int = 0,
    val refereeBonus: Int = 0,
    val rewardedAt: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class ReferralResponseDto(
    val code: String = "",
    val usageCount: Int = 0,
    val referrals: List<ReferralRowDto> = emptyList(),
)
