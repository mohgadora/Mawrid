package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** GET /api/v1/wallet → { data: { balance, lifetimeCredit, lifetimeDebit, currency } }. */
@Serializable
data class WalletDto(
    val balance: Double = 0.0,
    val lifetimeCredit: Double = 0.0,
    val lifetimeDebit: Double = 0.0,
    val currency: String = "USD",
)

/**
 * One wallet ledger row. `amount`/`balanceAfter` come back as numeric STRINGS
 * (Postgres numeric via Drizzle), so they're modeled as String and parsed.
 */
@Serializable
data class WalletTransactionDto(
    val id: String,
    val type: String = "",   // topup|purchase|refund|bonus|loyalty_convert|cashback|admin_credit|admin_debit
    val amount: String = "0",
    val balanceAfter: String = "0",
    val reference: String? = null,
    val note: String? = null,
    val createdAt: String? = null,
)

/** GET /api/v1/wallet/transactions → { data: { items, total, page, pageSize } }. */
@Serializable
data class WalletTransactionsDto(
    val items: List<WalletTransactionDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)

/** POST /api/v1/wallet/topup body. amount in USD, method optional. */
@Serializable
data class TopupRequest(val amount: Double, val method: String? = "manual")

/** POST /api/v1/wallet/topup → { data: { balance, bonus } }. */
@Serializable
data class TopupResultDto(
    val balance: Double = 0.0,
    val bonus: Double = 0.0,
)
