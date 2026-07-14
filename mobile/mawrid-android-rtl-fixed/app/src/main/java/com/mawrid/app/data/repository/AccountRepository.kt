package com.mawrid.app.data.repository

import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.data.remote.dto.AddAddressRequest
import com.mawrid.app.data.remote.dto.BuyerTypeRequest
import com.mawrid.app.data.remote.dto.CreateRefundRequest
import com.mawrid.app.data.remote.dto.OtpSendRequest
import com.mawrid.app.data.remote.dto.OtpVerifyRequest
import com.mawrid.app.data.remote.dto.RedeemPointsRequest
import com.mawrid.app.data.remote.dto.SaveTemplateRequest
import com.mawrid.app.data.remote.dto.SubmitKycRequest
import com.mawrid.app.data.remote.dto.TemplateItemInput
import com.mawrid.app.data.remote.dto.TopupRequest
import com.mawrid.app.data.remote.dto.UpdateProfileRequest
import com.mawrid.app.domain.model.Address
import com.mawrid.app.domain.model.KycStatus
import com.mawrid.app.domain.model.Loyalty
import com.mawrid.app.domain.model.NotificationsFeed
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.Referral
import com.mawrid.app.domain.model.RefundRequest
import com.mawrid.app.domain.model.ReorderTemplate
import com.mawrid.app.domain.model.Supplier
import com.mawrid.app.domain.model.UserProfile
import com.mawrid.app.domain.model.Wallet
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AccountRepository @Inject constructor(
    private val api: MawridApi,
    private val apiConfig: ApiConfig,
) {
    suspend fun profile(): Result<UserProfile> = runCatching {
        api.getProfile().data.toDomain()
    }

    suspend fun updateProfile(name: String, phone: String): Result<UserProfile> = runCatching {
        api.updateProfile(UpdateProfileRequest(name = name.trim(), phone = phone.trim())).data.toDomain()
    }

    suspend fun addresses(): Result<List<Address>> = runCatching {
        api.getAddresses().data.map { it.toDomain() }
    }

    suspend fun addAddress(label: String, line1: String, city: String, phone: String): Result<Address> = runCatching {
        api.addAddress(
            AddAddressRequest(label = label.trim(), line1 = line1.trim(), city = city.trim(), phone = phone.trim())
        ).data.toDomain()
    }

    suspend fun favorites(): Result<List<Product>> = runCatching {
        val origin = apiConfig.baseUrl().trimEnd('/')
        api.getFavorites().data.map { it.toDomain(origin) }
    }

    suspend fun toggleFavorite(productId: String): Result<Unit> = runCatching {
        api.toggleFavorite(productId)
    }

    /** Whether the signed-in user follows supplier [id]. Defaults to false on error. */
    suspend fun isFollowing(id: String): Boolean =
        runCatching { api.followState(id).data.following }.getOrDefault(false)

    /** Follow ([follow]=true) or unfollow supplier [id]; returns the new follow state. */
    suspend fun setFollowing(id: String, follow: Boolean): Result<Boolean> = runCatching {
        if (follow) api.followShop(id).data.following else api.unfollowShop(id).data.following
    }

    /** Suppliers the user follows (GET /api/v1/account/following). */
    suspend fun following(): Result<List<Supplier>> = runCatching {
        val origin = apiConfig.baseUrl().trimEnd('/')
        api.getFollowing().data.map { it.toDomain(origin) }
    }

    /** Notifications feed + unread count (GET /api/v1/account/notifications). */
    suspend fun notifications(): Result<NotificationsFeed> = runCatching {
        api.getNotifications().data.toDomain()
    }

    suspend fun markAllNotificationsRead(): Result<Unit> = runCatching { api.markAllNotificationsRead() }

    suspend fun markNotificationRead(id: String): Result<Unit> = runCatching { api.markNotificationRead(id) }

    /** Loyalty account + recent ledger (GET /api/v1/account/loyalty). */
    suspend fun loyalty(): Result<Loyalty> = runCatching { api.getLoyalty().data.toDomain() }

    /** Redeem [points] loyalty points; returns the new balance. */
    suspend fun redeemPoints(points: Int): Result<Int> = runCatching {
        api.redeemPoints(RedeemPointsRequest(points)).data.balance
    }

    /** Referral code + referred users (GET /api/v1/account/referral). */
    suspend fun referral(): Result<Referral> = runCatching { api.getReferral().data.toDomain() }

    /** Wallet summary + first page of transactions (two endpoints, combined). */
    suspend fun wallet(): Result<Wallet> = runCatching {
        val summary = api.getWallet().data
        val txns = api.getWalletTransactions().data
        summary.toDomain(txns)
    }

    /** Top up the wallet by [amountUsd]; returns the new balance in USD. */
    suspend fun topupWallet(amountUsd: Double): Result<Double> = runCatching {
        api.topupWallet(TopupRequest(amount = amountUsd)).data.balance
    }

    // ── KYC ──────────────────────────────────────────────────────────────
    suspend fun kyc(): Result<KycStatus> = runCatching { api.getKyc().data.toDomain() }

    /** Submit merchant KYC; re-fetches the canonical status afterwards. */
    suspend fun submitKyc(company: String, crNumber: String, vatNumber: String): Result<KycStatus> = runCatching {
        api.submitKyc(
            SubmitKycRequest(
                company = company.trim(),
                crNumber = crNumber.trim().ifBlank { null },
                vatNumber = vatNumber.trim().ifBlank { null },
            )
        )
        api.getKyc().data.toDomain()
    }

    // ── Reorder templates ────────────────────────────────────────────────
    suspend fun templates(): Result<List<ReorderTemplate>> = runCatching {
        val origin = apiConfig.baseUrl().trimEnd('/')
        api.getTemplates().data.map { it.toDomain(origin) }
    }

    /** Save a named template from [items] (productId → qty). */
    suspend fun saveTemplate(name: String, items: List<Pair<String, Int>>): Result<Unit> = runCatching {
        api.saveTemplate(
            SaveTemplateRequest(name.trim(), items.map { TemplateItemInput(it.first, it.second) })
        )
        Unit
    }

    // ── Refunds ──────────────────────────────────────────────────────────
    suspend fun refunds(): Result<List<RefundRequest>> = runCatching {
        api.getRefunds().data.map { it.toDomain() }
    }

    /** Request a refund for [orderId] with a [reason] (+ optional note). */
    suspend fun requestRefund(orderId: String, reason: String, description: String?): Result<Unit> = runCatching {
        api.createRefund(CreateRefundRequest(orderId, reason, description?.trim()?.ifBlank { null }))
        Unit
    }

    // ── OTP phone verification ───────────────────────────────────────────
    suspend fun sendOtp(phone: String): Result<Unit> = runCatching {
        api.sendOtp(OtpSendRequest(phone.trim()))
    }

    /** Verify the OTP [code] for [phone]; links the phone to the account server-side. */
    suspend fun verifyOtp(phone: String, code: String): Result<Boolean> = runCatching {
        api.verifyOtp(OtpVerifyRequest(phone.trim(), code.trim())).data.verified
    }

    /** Switch buyer type (consumer/merchant). Returns the updated profile (with `role`). */
    suspend fun setBuyerType(role: String, company: String?): Result<UserProfile> = runCatching {
        api.setBuyerType(BuyerTypeRequest(role, company?.trim()?.ifBlank { null })).data.toDomain()
    }
}
