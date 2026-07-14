package com.mawrid.app.domain.model

/** A wallet ledger entry. [amountUsd] is negative for debits (purchases, admin_debit). */
data class WalletEntry(
    val id: String,
    val type: String,
    val amountUsd: Double,
    val balanceAfterUsd: Double,
    val note: String?,
    val createdAtIso: String?,
)

/** Wallet summary (balances are in USD; the app displays them via the shared FX). */
data class Wallet(
    val balanceUsd: Double,
    val lifetimeCreditUsd: Double,
    val lifetimeDebitUsd: Double,
    val currency: String,
    val entries: List<WalletEntry>,
) {
    companion object {
        val EMPTY = Wallet(0.0, 0.0, 0.0, "USD", emptyList())
    }
}
