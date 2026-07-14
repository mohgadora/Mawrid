package com.mawrid.app.ui.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.CartRepository
import com.mawrid.app.domain.model.CartLine
import com.mawrid.app.domain.model.CartSummary
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

data class CartUiState(
    val lines: List<CartLine> = emptyList(),
    val summary: CartSummary = CartSummary.EMPTY,
) {
    val isEmpty: Boolean get() = lines.isEmpty()
}

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cart: CartRepository,
) : ViewModel() {

    val state: StateFlow<CartUiState> = cart.lines
        .map { lines -> CartUiState(lines, CartSummary.from(lines)) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), CartUiState())

    fun increase(line: CartLine) = cart.setQty(line.key, line.qty + 1)
    fun decrease(line: CartLine) = cart.setQty(line.key, line.qty - 1)
    fun remove(line: CartLine) = cart.remove(line.key)
}
