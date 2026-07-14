package com.mawrid.app.ui.categories

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.domain.model.Category
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CategoriesUiState(
    val loading: Boolean = true,
    val categories: List<Category> = emptyList(),
    val error: String? = null,
)

@HiltViewModel
class CategoriesViewModel @Inject constructor(
    private val repo: CatalogRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(CategoriesUiState())
    val state: StateFlow<CategoriesUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            repo.categories()
                .onSuccess { list ->
                    // Show only top-level categories (like the website's
                    // food/beverages/snacks/cleaning). Each rolls up its children's
                    // products; leaf sub-categories would otherwise dead-end on the
                    // empty ones. Fall back to the full list if the API ever returns
                    // no top-level markers, so the screen is never empty.
                    val topLevel = list.filter { it.isTopLevel }
                    _state.update { it.copy(loading = false, categories = topLevel.ifEmpty { list }) }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
