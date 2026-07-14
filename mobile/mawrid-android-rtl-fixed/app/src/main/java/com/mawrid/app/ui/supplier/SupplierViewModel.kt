package com.mawrid.app.ui.supplier

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.Supplier
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SupplierUiState(
    val loading: Boolean = true,
    val supplier: Supplier? = null,
    val products: List<Product> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val isFollowing: Boolean = false,
)

@HiltViewModel
class SupplierViewModel @Inject constructor(
    private val catalog: CatalogRepository,
    private val account: AccountRepository,
    auth: AuthRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val supplierId: String = checkNotNull(savedStateHandle[Routes.ARG_SUPPLIER_ID]) {
        "Supplier requires a ${Routes.ARG_SUPPLIER_ID} argument"
    }

    private val _state = MutableStateFlow(SupplierUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<SupplierUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            catalog.supplier(supplierId)
                .onSuccess { result ->
                    _state.update {
                        it.copy(loading = false, supplier = result.supplier, products = result.products)
                    }
                    if (_state.value.isLoggedIn) {
                        val following = account.isFollowing(supplierId)
                        _state.update { it.copy(isFollowing = following) }
                    }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /** Optimistic follow/unfollow; reverts on failure. */
    fun toggleFollow() {
        if (!_state.value.isLoggedIn) return
        val target = !_state.value.isFollowing
        _state.update { it.copy(isFollowing = target) }
        viewModelScope.launch {
            account.setFollowing(supplierId, target)
                .onFailure { _state.update { it.copy(isFollowing = !target) } }
        }
    }
}
