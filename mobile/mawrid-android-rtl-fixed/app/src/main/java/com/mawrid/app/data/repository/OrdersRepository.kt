package com.mawrid.app.data.repository

import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.data.remote.dto.CreateOrderRequest
import com.mawrid.app.data.remote.dto.OrderAddressRequest
import com.mawrid.app.data.remote.dto.OrderLineRequest
import com.mawrid.app.domain.model.CartLine
import com.mawrid.app.domain.model.Order
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrdersRepository @Inject constructor(
    private val api: MawridApi,
    private val apiConfig: ApiConfig,
) {
    suspend fun orders(): Result<List<Order>> = runCatching {
        val origin = origin()
        api.getOrders().data.map { it.toDomain(origin) }
    }

    suspend fun order(id: String): Result<Order> = runCatching {
        api.getOrder(id).data.toDomain(origin())
    }

    /**
     * Place an order from the current cart. Only productId/qty/variantId are sent
     * — the server recomputes the authoritative price and returns final totals.
     */
    suspend fun placeOrder(
        lines: List<CartLine>,
        label: String,
        line1: String,
        city: String,
        phone: String,
        paymentMethod: String,
        couponCode: String? = null,
    ): Result<Order> = runCatching {
        val request = CreateOrderRequest(
            lines = lines.map { OrderLineRequest(it.product.id, it.qty, it.variant?.id) },
            address = OrderAddressRequest(label = label, line1 = line1, city = city, phone = phone),
            paymentMethod = paymentMethod,
            couponCode = couponCode?.takeIf { it.isNotBlank() },
        )
        api.createOrder(request).data.toDomain(origin())
    }

    /** Cancel then re-fetch: the cancel endpoint only returns `{cancelled:true}`. */
    suspend fun cancel(id: String): Result<Order> = runCatching {
        api.cancelOrder(id)
        api.getOrder(id).data.toDomain(origin())
    }

    private suspend fun origin(): String = apiConfig.baseUrl().trimEnd('/')
}
