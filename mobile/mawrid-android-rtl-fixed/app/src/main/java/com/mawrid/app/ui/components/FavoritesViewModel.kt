package com.mawrid.app.ui.components

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Shared favorite state for product grids. One instance per screen (obtained via
 * `hiltViewModel()` inside [ProductCard]), so every card on a screen reads/toggles
 * the same set — no per-screen wiring needed. Toggles are optimistic: flip the set
 * immediately, then POST, and revert on failure. Signed-out taps are ignored (the
 * product-detail screen owns the login-routing path).
 */
@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    val isLoggedIn: Boolean = auth.isLoggedIn.value

    private val _ids = MutableStateFlow<Set<String>>(emptySet())
    val ids: StateFlow<Set<String>> = _ids.asStateFlow()

    init { if (isLoggedIn) refresh() }

    private fun refresh() {
        viewModelScope.launch {
            account.favorites().onSuccess { list -> _ids.value = list.map { it.id }.toSet() }
        }
    }

    fun toggle(productId: String) {
        if (!isLoggedIn) return
        val previous = _ids.value
        _ids.value = if (productId in previous) previous - productId else previous + productId
        viewModelScope.launch {
            account.toggleFavorite(productId).onFailure { _ids.value = previous }
        }
    }
}
