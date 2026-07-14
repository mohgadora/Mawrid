package com.mawrid.app.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.OrdersRepository
import com.mawrid.app.domain.model.Order
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrdersUiState(
    val loading: Boolean = true,
    val orders: List<Order> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val repo: OrdersRepository,
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(OrdersUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()

    init {
        if (auth.isLoggedIn.value) load() else _state.update { it.copy(loading = false) }
    }

    fun load() {
        if (!auth.isLoggedIn.value) {
            _state.update { it.copy(loading = false, isLoggedIn = false) }
            return
        }
        _state.update { it.copy(loading = true, error = null, isLoggedIn = true) }
        viewModelScope.launch {
            repo.orders()
                .onSuccess { list -> _state.update { it.copy(loading = false, orders = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
