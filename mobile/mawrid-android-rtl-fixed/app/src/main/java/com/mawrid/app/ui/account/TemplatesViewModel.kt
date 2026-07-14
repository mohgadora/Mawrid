package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.CartRepository
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.domain.model.ReorderTemplate
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TemplatesUiState(
    val loading: Boolean = true,
    val templates: List<ReorderTemplate> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val cartCount: Int = 0,
    val busy: Boolean = false,
    val message: String? = null,
)

@HiltViewModel
class TemplatesViewModel @Inject constructor(
    private val account: AccountRepository,
    private val cart: CartRepository,
    private val catalog: CatalogRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(TemplatesUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<TemplatesUiState> = _state.asStateFlow()

    init {
        if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) }
        viewModelScope.launch {
            cart.lines.collect { lines -> _state.update { it.copy(cartCount = lines.sumOf { l -> l.qty }) } }
        }
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.templates()
                .onSuccess { list -> _state.update { it.copy(loading = false, templates = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /** Save the current cart as a named template. */
    fun saveCurrentCart(name: String) {
        val lines = cart.lines.value
        if (name.isBlank() || lines.isEmpty() || _state.value.busy) return
        _state.update { it.copy(busy = true) }
        viewModelScope.launch {
            account.saveTemplate(name, lines.map { it.product.id to it.qty })
                .onSuccess {
                    _state.update { it.copy(busy = false, message = "تم حفظ القالب") }
                    load()
                }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message ?: "تعذّر الحفظ") } }
        }
    }

    /** Add every item of [template] to the cart (fetches each product for pricing). */
    fun reorder(template: ReorderTemplate) {
        if (_state.value.busy) return
        _state.update { it.copy(busy = true) }
        viewModelScope.launch {
            var added = 0
            for (item in template.items) {
                catalog.product(item.productId).onSuccess { p ->
                    cart.add(p, null, item.qty)
                    added++
                }
            }
            _state.update {
                it.copy(
                    busy = false,
                    message = if (added > 0) "أُضيفت $added أصناف إلى السلة" else "تعذّرت إضافة الأصناف",
                )
            }
        }
    }

    fun consumeMessage() = _state.update { it.copy(message = null) }
}
