package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.dto.LoyaltyResponseDto
import com.mawrid.app.data.remote.dto.LoyaltyTransactionDto
import com.mawrid.app.data.remote.dto.ReferralResponseDto
import com.mawrid.app.data.remote.dto.ReferralRowDto
import com.mawrid.app.data.remote.dto.WalletDto
import com.mawrid.app.data.remote.dto.WalletTransactionDto
import com.mawrid.app.data.remote.dto.WalletTransactionsDto
import com.mawrid.app.domain.model.Loyalty
import com.mawrid.app.domain.model.LoyaltyEntry
import com.mawrid.app.domain.model.Referral
import com.mawrid.app.domain.model.ReferralEntry
import com.mawrid.app.domain.model.Wallet
import com.mawrid.app.domain.model.WalletEntry

internal fun LoyaltyTransactionDto.toDomain(): LoyaltyEntry = LoyaltyEntry(
    id = id,
    type = type,
    points = points,
    balanceAfter = balanceAfter,
    note = note,
    createdAtIso = createdAt,
)

internal fun LoyaltyResponseDto.toDomain(): Loyalty = Loyalty(
    balance = account.balance,
    lifetimeEarned = account.lifetimeEarned,
    lifetimeRedeemed = account.lifetimeRedeemed,
    entries = transactions.map { it.toDomain() },
)

internal fun ReferralRowDto.toDomain(): ReferralEntry = ReferralEntry(
    id = id,
    status = status,
    referrerBonus = referrerBonus,
    createdAtIso = createdAt,
)

internal fun ReferralResponseDto.toDomain(): Referral = Referral(
    code = code,
    usageCount = usageCount,
    entries = referrals.map { it.toDomain() },
)

internal fun WalletTransactionDto.toDomain(): WalletEntry = WalletEntry(
    id = id,
    type = type,
    amountUsd = amount.toDoubleOrNull() ?: 0.0,
    balanceAfterUsd = balanceAfter.toDoubleOrNull() ?: 0.0,
    note = note,
    createdAtIso = createdAt,
)

/** Combine the wallet summary with its ledger page into one domain object. */
internal fun WalletDto.toDomain(txns: WalletTransactionsDto): Wallet = Wallet(
    balanceUsd = balance,
    lifetimeCreditUsd = lifetimeCredit,
    lifetimeDebitUsd = lifetimeDebit,
    currency = currency,
    entries = txns.items.map { it.toDomain() },
)
