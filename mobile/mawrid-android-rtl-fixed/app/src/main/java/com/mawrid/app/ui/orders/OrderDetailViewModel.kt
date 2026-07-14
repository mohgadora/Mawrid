package com.mawrid.app.ui.orders

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.OrdersRepository
import com.mawrid.app.domain.model.Order
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderDetailUiState(
    val loading: Boolean = true,
    val order: Order? = null,
    val error: String? = null,
    val cancelling: Boolean = false,
    val refunding: Boolean = false,
    val refundError: String? = null,
    val refundMessage: String? = null,
)

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    private val repo: OrdersRepository,
    private val account: AccountRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val orderId: String = checkNotNull(savedStateHandle[Routes.ARG_ORDER_ID])

    private val _state = MutableStateFlow(OrderDetailUiState())
    val state: StateFlow<OrderDetailUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            repo.order(orderId)
                .onSuccess { order -> _state.update { it.copy(loading = false, order = order) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun cancel() {
        if (_state.value.cancelling) return
        _state.update { it.copy(cancelling = true) }
        viewModelScope.launch {
            repo.cancel(orderId)
                .onSuccess { order -> _state.update { it.copy(cancelling = false, order = order) } }
                .onFailure { e -> _state.update { it.copy(cancelling = false, error = e.message ?: "تعذّر الإلغاء") } }
        }
    }

    /** Request a refund for this order with the chosen [reason] (+ optional note). */
    fun requestRefund(reason: String, note: String?) {
        if (_state.value.refunding) return
        _state.update { it.copy(refunding = true, refundError = null) }
        viewModelScope.launch {
            account.requestRefund(orderId, reason, note)
                .onSuccess { _state.update { it.copy(refunding = false, refundMessage = "تم إرسال طلب الاسترجاع") } }
                .onFailure { e -> _state.update { it.copy(refunding = false, refundError = e.message ?: "تعذّر إرسال الطلب") } }
        }
    }

    fun consumeRefundMessage() = _state.update { it.copy(refundMessage = null) }
}
