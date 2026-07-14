package com.mawrid.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val loading: Boolean = true,
    val products: List<Product> = emptyList(),
    val error: String? = null,
    /** API origin (no trailing slash) for building the hero banner image URLs. */
    val baseOrigin: String = "",
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repo: CatalogRepository,
    private val apiConfig: ApiConfig,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            _state.update { it.copy(baseOrigin = apiConfig.baseUrl().trimEnd('/')) }
            repo.products()
                .onSuccess { list -> _state.update { it.copy(loading = false, products = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
