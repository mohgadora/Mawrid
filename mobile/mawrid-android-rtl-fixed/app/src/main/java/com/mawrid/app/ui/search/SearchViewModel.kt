package com.mawrid.app.ui.search

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.data.repository.ProductSearchQuery
import com.mawrid.app.domain.model.Product
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Sort options exposed as chips, mapping to the API's sortBy values. */
enum class SortOption(val apiValue: String, val labelAr: String) {
    RELEVANCE("relevance", "الصلة"),
    PRICE_ASC("price_asc", "الأقل سعرًا"),
    PRICE_DESC("price_desc", "الأعلى سعرًا"),
    RATING("rating", "الأعلى تقييمًا"),
    NEWEST("newest", "الأحدث"),
}

data class SearchUiState(
    val query: String = "",
    /** Fixed category context when arriving from the categories screen (a slug). */
    val category: String? = null,
    val sort: SortOption = SortOption.RELEVANCE,
    val inStockOnly: Boolean = false,
    val results: List<Product> = emptyList(),
    val loading: Boolean = false,
    val loadingMore: Boolean = false,
    val error: String? = null,
    val page: Int = 1,
    val totalPages: Int = 1,
    val total: Int = 0,
) {
    val canLoadMore: Boolean get() = page < totalPages && !loading && !loadingMore
}

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repo: CatalogRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _state = MutableStateFlow(
        SearchUiState(
            query = savedStateHandle.get<String>(Routes.ARG_QUERY).orEmpty(),
            category = savedStateHandle.get<String>(Routes.ARG_CATEGORY),
        )
    )
    val state: StateFlow<SearchUiState> = _state.asStateFlow()

    private var searchJob: Job? = null

    init {
        // Run an initial search if we arrived with a query or a category filter.
        if (_state.value.query.isNotBlank() || _state.value.category != null) search()
    }

    /** Called on every keystroke; debounces then searches from page 1. */
    fun onQueryChange(text: String) {
        _state.update { it.copy(query = text) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(DEBOUNCE_MS)
            search()
        }
    }

    /**
     * Clear the category scope inherited from the categories screen. Without this
     * the filter is sticky and invisible — a query would keep AND-ing with the
     * category (e.g. `q=sugar&category=chicken` → no results) with no way out.
     */
    fun clearCategory() {
        if (_state.value.category == null) return
        _state.update { it.copy(category = null) }
        search()
    }

    fun setSort(option: SortOption) {
        if (option == _state.value.sort) return
        _state.update { it.copy(sort = option) }
        search()
    }

    fun toggleInStock() {
        _state.update { it.copy(inStockOnly = !it.inStockOnly) }
        search()
    }

    /** Fetch page 1 with the current filters, replacing existing results. */
    fun search() {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null, page = 1) }
            val s = _state.value
            // Category browsing (a category is set and there's no text query) goes
            // through the rollup endpoint so a parent category shows its whole
            // subtree's products — matching the website. As soon as the user types
            // a query we fall back to the paginated search endpoint.
            if (s.category != null && s.query.isBlank()) {
                repo.categoryProducts(s.category)
                    .onSuccess { products ->
                        val sorted = sortClientSide(products, s.sort)
                        _state.update {
                            it.copy(
                                loading = false,
                                results = sorted,
                                page = 1,
                                totalPages = 1,
                                total = sorted.size,
                            )
                        }
                    }
                    .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
                return@launch
            }
            repo.search(buildQuery(page = 1))
                .onSuccess { pageResult ->
                    _state.update {
                        it.copy(
                            loading = false,
                            results = pageResult.products,
                            page = pageResult.page,
                            totalPages = pageResult.totalPages,
                            total = pageResult.total,
                        )
                    }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /**
     * The category-rollup endpoint returns an unpaginated, unsorted list, so the
     * sort chips are applied client-side for that path. `relevance`/`newest` keep
     * the server's order.
     */
    private fun sortClientSide(products: List<Product>, sort: SortOption): List<Product> = when (sort) {
        SortOption.PRICE_ASC -> products.sortedBy { it.basePriceUsd }
        SortOption.PRICE_DESC -> products.sortedByDescending { it.basePriceUsd }
        SortOption.RATING -> products.sortedByDescending { it.rating }
        else -> products
    }

    /** Append the next page to the current results (infinite scroll). */
    fun loadMore() {
        val current = _state.value
        if (!current.canLoadMore) return
        viewModelScope.launch {
            _state.update { it.copy(loadingMore = true) }
            repo.search(buildQuery(page = current.page + 1))
                .onSuccess { pageResult ->
                    _state.update {
                        it.copy(
                            loadingMore = false,
                            results = it.results + pageResult.products,
                            page = pageResult.page,
                            totalPages = pageResult.totalPages,
                        )
                    }
                }
                .onFailure { _state.update { it.copy(loadingMore = false) } }
        }
    }

    private fun buildQuery(page: Int): ProductSearchQuery = with(_state.value) {
        ProductSearchQuery(
            q = query,
            category = category,
            sortBy = sort.apiValue,
            inStock = if (inStockOnly) true else null,
            page = page,
        )
    }

    private companion object {
        const val DEBOUNCE_MS = 350L
    }
}
