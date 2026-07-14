package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.data.remote.dto.CashbackPreviewRequest
import com.mawrid.app.data.remote.dto.CouponValidateRequest
import com.mawrid.app.data.remote.dto.OrderLineRequest
import com.mawrid.app.domain.model.CartLine
import com.mawrid.app.domain.model.CouponValidation
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Checkout-time promotions: coupon validation and cashback preview. Both re-price
 * on the server from productId/qty, so we only send the cart lines.
 */
@Singleton
class PromotionsRepository @Inject constructor(
    private val api: MawridApi,
    private val json: Json,
) {
    private fun List<CartLine>.toRequestItems(): List<OrderLineRequest> =
        map { OrderLineRequest(productId = it.product.id, qty = it.qty, variantId = it.variant?.id) }

    /**
     * Validate [code] against [lines]; returns the server's discount/free-shipping verdict.
     * On an HTTP error the server's `{error}` message (e.g. "كود الكوبون غير صالح") is surfaced.
     */
    suspend fun validateCoupon(code: String, lines: List<CartLine>): Result<CouponValidation> = runCatching {
        val r = api.validateCoupon(CouponValidateRequest(code.trim(), lines.toRequestItems())).data
        CouponValidation(
            valid = r.valid,
            message = r.message,
            code = r.code ?: code.trim().uppercase(),
            discountUsd = r.discountUsd,
            freeShipping = r.freeShipping,
            type = r.type,
        )
    }.recoverCatching { e -> throw Exception(e.apiMessage(json) ?: "تعذّر التحقق من الكوبون") }

    /** Preview how much cashback (wholesale USD) this cart would earn. */
    suspend fun cashbackPreview(lines: List<CartLine>): Result<Double> = runCatching {
        api.cashbackPreview(CashbackPreviewRequest(lines.toRequestItems())).data.cashbackUsd
    }
}
