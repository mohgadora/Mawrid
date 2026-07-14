package com.mawrid.app.ui.categories

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.domain.model.Category
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@Composable
fun CategoriesScreen(
    onCategoryClick: (String) -> Unit,
    vm: CategoriesViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("الفئات")
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(
                message = state.error,
                onRetry = vm::load,
                title = "تعذّر تحميل الفئات",
            )
            state.categories.isEmpty() -> EmptyState("لا توجد فئات")
            else -> LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                items(state.categories, key = { it.slug }) { category ->
                    CategoryCard(category = category, onClick = { onCategoryClick(category.slug) })
                }
            }
        }
    }
}

@Composable
private fun ScreenHeader(title: String) {
    Surface(color = MaterialTheme.colorScheme.primary) {
        Text(
            title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        )
    }
}

@Composable
private fun CategoryCard(category: Category, onClick: () -> Unit) {
    Card(shape = RoundedCornerShape(12.dp), modifier = Modifier.clickable(onClick = onClick)) {
        // The API doesn't (yet) provide category images, so we render a themed
        // tile; if an imageUrl ever appears it's shown as a background instead.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1.6f)
                .background(MaterialTheme.colorScheme.secondaryContainer),
            contentAlignment = Alignment.Center,
        ) {
            if (!category.imageUrl.isNullOrBlank()) {
                AsyncImage(
                    model = category.imageUrl,
                    contentDescription = category.displayName(IS_ARABIC),
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().aspectRatio(1.6f),
                )
            }
            Column(
                Modifier.padding(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    category.displayName(IS_ARABIC),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                category.productCount?.let { count ->
                    Text(
                        "$count منتج",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
