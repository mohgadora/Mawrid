package com.mawrid.app.ui.wishlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WishlistUiState(
    val loading: Boolean = true,
    val products: List<Product> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class WishlistViewModel @Inject constructor(
    private val account: AccountRepository,
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(WishlistUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<WishlistUiState> = _state.asStateFlow()

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
            account.favorites()
                .onSuccess { list -> _state.update { it.copy(loading = false, products = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /** Remove a product from favorites (optimistic), then confirm with the server. */
    fun removeFavorite(productId: String) {
        _state.update { it.copy(products = it.products.filterNot { p -> p.id == productId }) }
        viewModelScope.launch { account.toggleFavorite(productId) }
    }
}
