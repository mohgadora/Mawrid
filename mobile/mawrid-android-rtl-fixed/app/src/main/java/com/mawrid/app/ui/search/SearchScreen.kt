package com.mawrid.app.ui.search

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.LaunchedEffect
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState
import com.mawrid.app.ui.components.ProductCard

@Composable
fun SearchScreen(
    onProductClick: (String) -> Unit,
    vm: SearchViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val gridState = rememberLazyGridState()

    // Infinite scroll: when the last item nears the viewport, load the next page.
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = gridState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = gridState.layoutInfo.totalItemsCount
            totalItems > 0 && lastVisible >= totalItems - 4
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) vm.loadMore()
    }

    Column(Modifier.fillMaxSize()) {
        SearchBar(query = state.query, onQueryChange = vm::onQueryChange, onSubmit = vm::search)
        FilterRow(
            category = state.category,
            onClearCategory = vm::clearCategory,
            sort = state.sort,
            inStockOnly = state.inStockOnly,
            onSortChange = vm::setSort,
            onToggleInStock = vm::toggleInStock,
        )

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(
                message = state.error,
                onRetry = vm::search,
                title = "تعذّر تنفيذ البحث",
            )
            state.results.isEmpty() -> EmptyState(
                if (state.query.isBlank() && state.category == null) "ابحث عن المنتجات"
                else "لا توجد نتائج"
            )
            else -> LazyVerticalGrid(
                state = gridState,
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.results, key = { it.id }) { product ->
                    ProductCard(product = product, onClick = { onProductClick(product.id) })
                }
                if (state.loadingMore) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onSubmit: () -> Unit,
) {
    Surface(color = MaterialTheme.colorScheme.primary) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            singleLine = true,
            placeholder = { Text("ابحث عن منتج…") },
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSubmit() }),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
        )
    }
}

@Composable
private fun FilterRow(
    category: String?,
    onClearCategory: () -> Unit,
    sort: SortOption,
    inStockOnly: Boolean,
    onSortChange: (SortOption) -> Unit,
    onToggleInStock: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // A removable chip for the category scope inherited from the categories
        // screen, so the filter is visible and the user can clear it (tap = clear).
        if (category != null) {
            FilterChip(
                selected = true,
                onClick = onClearCategory,
                label = { Text(category) },
                trailingIcon = {
                    Icon(Icons.Filled.Close, contentDescription = "إزالة الفئة", modifier = Modifier.size(18.dp))
                },
            )
        }
        FilterChip(
            selected = inStockOnly,
            onClick = onToggleInStock,
            label = { Text("المتوفر فقط") },
        )
        SortOption.entries.forEach { option ->
            FilterChip(
                selected = option == sort,
                onClick = { onSortChange(option) },
                label = { Text(option.labelAr) },
            )
        }
    }
}
