package com.mawrid.app.ui.checkout

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.CartRepository
import com.mawrid.app.data.repository.OrdersRepository
import com.mawrid.app.data.repository.PromotionsRepository
import com.mawrid.app.domain.model.Address
import com.mawrid.app.domain.model.CartSummary
import com.mawrid.app.domain.model.CouponValidation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Payment options accepted by the order endpoint. */
enum class PaymentMethod(val apiValue: String, val labelAr: String) {
    COD("cod", "الدفع عند الاستلام"),
    CARD("card", "بطاقة مصرفية"),
    BANK("bank", "تحويل بنكي"),
}

data class CheckoutUiState(
    val isLoggedIn: Boolean = false,
    val summary: CartSummary = CartSummary.EMPTY,
    val addresses: List<Address> = emptyList(),
    val selectedAddressId: String? = null,   // null → use the new-address form
    val label: String = "",
    val line1: String = "",
    val city: String = "",
    val phone: String = "",
    val payment: PaymentMethod = PaymentMethod.COD,
    val placing: Boolean = false,
    val error: String? = null,
    val placedOrderId: String? = null,
    // Promotions (coupon + cashback preview)
    val couponCode: String = "",
    val applyingCoupon: Boolean = false,
    val coupon: CouponValidation? = null,     // set once a valid coupon is applied
    val couponError: String? = null,
    val cashbackUsd: Double? = null,          // null → unknown/unavailable
) {
    val useNewAddress: Boolean get() = selectedAddressId == null
    val newAddressValid: Boolean
        get() = label.isNotBlank() && line1.isNotBlank() && city.isNotBlank() && phone.isNotBlank()
    val canPlace: Boolean
        get() = isLoggedIn && summary.itemCount > 0 && !placing &&
            (!useNewAddress || newAddressValid)

    /** Wholesale-USD coupon discount, if a valid coupon is applied. */
    val discountUsd: Double get() = coupon?.takeIf { it.valid }?.discountUsd ?: 0.0
    private val shippingWaivedUsd: Double get() = if (coupon?.freeShipping == true) summary.shippingUsd else 0.0

    /** Preview payable total after coupon (server re-confirms at order time). */
    val payableUsd: Double get() = (summary.totalUsd - discountUsd - shippingWaivedUsd).coerceAtLeast(0.0)
}

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val cart: CartRepository,
    private val orders: OrdersRepository,
    private val account: AccountRepository,
    private val promotions: PromotionsRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(CheckoutUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<CheckoutUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            cart.lines.collect { lines ->
                // Cart changed → recompute totals, drop any applied coupon (its
                // discount was priced against the old cart), and refresh cashback.
                _state.update { it.copy(summary = CartSummary.from(lines), coupon = null, couponError = null) }
                refreshCashback()
            }
        }
        viewModelScope.launch {
            auth.isLoggedIn.collect { loggedIn ->
                _state.update { it.copy(isLoggedIn = loggedIn) }
                if (loggedIn) loadAddresses()
            }
        }
    }

    private fun loadAddresses() {
        viewModelScope.launch {
            account.addresses().onSuccess { list ->
                _state.update {
                    it.copy(
                        addresses = list,
                        // Prefer a default/first saved address; otherwise the new form.
                        selectedAddressId = (list.firstOrNull { a -> a.isDefault } ?: list.firstOrNull())?.id,
                    )
                }
            }
        }
    }

    /** Cashback preview for the current cart; silent on failure (endpoint may be absent). */
    private fun refreshCashback() {
        val lines = cart.lines.value
        if (lines.isEmpty()) { _state.update { it.copy(cashbackUsd = null) }; return }
        viewModelScope.launch {
            promotions.cashbackPreview(lines)
                .onSuccess { c -> _state.update { it.copy(cashbackUsd = c) } }
                .onFailure { _state.update { it.copy(cashbackUsd = null) } }
        }
    }

    fun onCouponCode(v: String) = _state.update { it.copy(couponCode = v, couponError = null) }

    /** Validate the entered coupon against the cart; keeps it applied on success. */
    fun applyCoupon() {
        val code = _state.value.couponCode.trim()
        val lines = cart.lines.value
        if (code.isEmpty() || lines.isEmpty() || _state.value.applyingCoupon) return
        _state.update { it.copy(applyingCoupon = true, couponError = null) }
        viewModelScope.launch {
            promotions.validateCoupon(code, lines)
                .onSuccess { v ->
                    if (v.valid) {
                        _state.update { it.copy(applyingCoupon = false, coupon = v, couponError = null) }
                    } else {
                        _state.update { it.copy(applyingCoupon = false, coupon = null, couponError = v.message ?: "كود الكوبون غير صالح") }
                    }
                }
                .onFailure { e -> _state.update { it.copy(applyingCoupon = false, coupon = null, couponError = e.message ?: "تعذّر التحقق من الكوبون") } }
        }
    }

    fun removeCoupon() = _state.update { it.copy(coupon = null, couponCode = "", couponError = null) }

    fun selectAddress(id: String?) = _state.update { it.copy(selectedAddressId = id) }
    fun onLabel(v: String) = _state.update { it.copy(label = v) }
    fun onLine1(v: String) = _state.update { it.copy(line1 = v) }
    fun onCity(v: String) = _state.update { it.copy(city = v) }
    fun onPhone(v: String) = _state.update { it.copy(phone = v) }
    fun setPayment(p: PaymentMethod) = _state.update { it.copy(payment = p) }

    fun placeOrder() {
        val s = _state.value
        if (!s.canPlace) return
        val lines = cart.lines.value
        if (lines.isEmpty()) return

        val address = s.addresses.firstOrNull { it.id == s.selectedAddressId }
        val label = address?.label ?: s.label
        val line1 = address?.line1 ?: s.line1
        val city = address?.city ?: s.city
        val phone = address?.phone ?: s.phone

        val couponCode = s.coupon?.takeIf { it.valid }?.code

        _state.update { it.copy(placing = true, error = null) }
        viewModelScope.launch {
            orders.placeOrder(lines, label, line1, city, phone, s.payment.apiValue, couponCode)
                .onSuccess { order ->
                    cart.clear()
                    _state.update { it.copy(placing = false, placedOrderId = order.id) }
                }
                .onFailure { e ->
                    _state.update { it.copy(placing = false, error = e.message ?: "تعذّر إتمام الطلب") }
                }
        }
    }
}
