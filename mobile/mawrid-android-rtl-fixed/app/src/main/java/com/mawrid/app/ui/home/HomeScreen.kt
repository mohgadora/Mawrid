package com.mawrid.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState
import com.mawrid.app.ui.components.ProductCard

@Composable
fun HomeScreen(
    onProductClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    onWishlistClick: () -> Unit,
    modifier: Modifier = Modifier,
    vm: HomeViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(modifier.fillMaxSize()) {
        MawridHeader(onSearchClick = onSearchClick, onWishlistClick = onWishlistClick)
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(
                message = state.error,
                onRetry = vm::load,
                title = "تعذّر تحميل المنتجات",
            )
            state.products.isEmpty() -> EmptyState("لا توجد منتجات")
            else -> LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                // Hero + trust badges and the AI section header span both columns.
                item(span = { GridItemSpan(maxLineSpan) }) {
                    HomeHero(baseOrigin = state.baseOrigin, onShopNow = {})
                }
                item(span = { GridItemSpan(maxLineSpan) }) {
                    AiSectionHeader(onRefresh = vm::load)
                }
                items(state.products, key = { it.id }) { product ->
                    ProductCard(product = product, onClick = { onProductClick(product.id) })
                }
            }
        }
    }
}

/**
 * Home header, ported from the website's `site-header.tsx`:
 *  - a thin **orange utility strip** (country/currency + language, decorative),
 *  - a dark bar with the orange rounded-square **logo badge** ("م") + wordmark,
 *    a bordered **search field** with a filled orange "بحث" button, and a
 *    trailing **wishlist** icon.
 *
 * The layout relies on the app's RTL layout direction (Arabic default), so `Row`
 * children flow right-to-left: logo on the trailing (right) edge, actions on the left.
 */
@Composable
private fun MawridHeader(onSearchClick: () -> Unit, onWishlistClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Column {
        // (a) Orange utility strip
        Surface(color = cs.primary, contentColor = cs.onPrimary) {
            Row(
                Modifier.fillMaxWidth().height(30.dp).padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("SAR · السعودية", style = MaterialTheme.typography.labelSmall)
                Text("العربية", style = MaterialTheme.typography.labelSmall)
            }
        }

        // (b) Dark main bar
        Surface(color = cs.surface) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                // Logo badge + wordmark
                Box(
                    Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(cs.primary),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "م",
                        color = cs.onPrimary,
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                    )
                }
                Text(
                    "مورِد",
                    color = cs.primary,
                    fontWeight = FontWeight.Black,
                    fontSize = 22.sp,
                )

                // Search field (tap → search screen)
                Row(
                    Modifier
                        .weight(1f)
                        .height(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .border(1.5.dp, cs.primary.copy(alpha = 0.7f), RoundedCornerShape(12.dp))
                        .background(cs.background)
                        .clickable(onClick = onSearchClick)
                        .padding(start = 12.dp, end = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "ابحث عن منتج، مورّد…",
                        color = cs.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.weight(1f),
                    )
                    // Filled orange "بحث" button
                    Row(
                        Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(cs.primary)
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Outlined.Search, contentDescription = null, tint = cs.onPrimary, modifier = Modifier.size(16.dp))
                        Text("بحث", color = cs.onPrimary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    }
                }

                // Wishlist
                Icon(
                    Icons.Outlined.FavoriteBorder,
                    contentDescription = "المفضلة",
                    tint = cs.onSurface,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(onClick = onWishlistClick)
                        .padding(6.dp),
                )
            }
        }
        Spacer(Modifier.height(0.dp))
    }
}

/**
 * "مختار لك بالذكاء الاصطناعي" section header, ported from `ai-recommendations.tsx`:
 * a Sparkles icon in a primary/10 rounded square + title + subtitle, and a
 * trailing "تحديث" refresh chip. On the app, refresh re-fetches the home list.
 */
@Composable
private fun AiSectionHeader(onRefresh: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Row(
        Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(cs.primary.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Outlined.AutoAwesome, contentDescription = null, tint = cs.primary, modifier = Modifier.size(16.dp))
        }
        Column(Modifier.weight(1f)) {
            Text("مختار لك بالذكاء الاصطناعي", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("الأكثر مبيعاً في المنصة", style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
        }
        Row(
            Modifier
                .clip(RoundedCornerShape(50))
                .border(1.dp, cs.outline, RoundedCornerShape(50))
                .background(cs.surface)
                .clickable(onClick = onRefresh)
                .padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Icon(Icons.Outlined.Refresh, contentDescription = null, tint = cs.onSurfaceVariant, modifier = Modifier.size(14.dp))
            Text("تحديث", style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
        }
    }
}
