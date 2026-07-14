package com.mawrid.app.ui.supplier

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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.domain.model.Supplier
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState
import com.mawrid.app.ui.components.ProductCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupplierScreen(
    onBack: () -> Unit,
    onProductClick: (String) -> Unit,
    vm: SupplierViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.supplier?.displayName(IS_ARABIC) ?: "المورّد", maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل المورّد")
                state.supplier == null -> EmptyState("المورّد غير موجود")
                else -> LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        SupplierHeader(
                            supplier = state.supplier!!,
                            isFollowing = state.isFollowing,
                            onToggleFollow = vm::toggleFollow,
                        )
                    }
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Text(
                            "منتجات المورّد",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 4.dp),
                        )
                    }
                    if (state.products.isEmpty()) {
                        item(span = { GridItemSpan(maxLineSpan) }) {
                            Text(
                                "لا توجد منتجات",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    } else {
                        items(state.products, key = { it.id }) { product ->
                            ProductCard(product = product, onClick = { onProductClick(product.id) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SupplierHeader(supplier: Supplier, isFollowing: Boolean, onToggleFollow: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, cs.outline, RoundedCornerShape(16.dp))
            .background(cs.surface)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AsyncImage(
                model = supplier.logoUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(64.dp).clip(CircleShape).background(cs.surfaceVariant),
            )
            Column(Modifier.weight(1f)) {
                Text(
                    supplier.displayName(IS_ARABIC),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    maxLines = 2,
                )
                if (supplier.verified) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        Icon(Icons.Filled.Verified, contentDescription = null, tint = MawridColors.Success, modifier = Modifier.size(14.dp))
                        Text("مورد موثّق", style = MaterialTheme.typography.labelSmall, color = MawridColors.Success, fontWeight = FontWeight.Bold)
                    }
                }
                if (supplier.followerCount > 0) {
                    Text(
                        "${supplier.followerCount} متابِع",
                        style = MaterialTheme.typography.labelSmall,
                        color = cs.onSurfaceVariant,
                    )
                }
            }
        }

        // Stats: rating · city · since
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Stat(icon = { Icon(Icons.Filled.Star, null, tint = MawridColors.StarAmber, modifier = Modifier.size(16.dp)) }, value = supplier.rating.toString())
            if (supplier.displayCity(IS_ARABIC).isNotBlank()) {
                Stat(icon = { Icon(Icons.Outlined.LocationOn, null, tint = cs.onSurfaceVariant, modifier = Modifier.size(16.dp)) }, value = supplier.displayCity(IS_ARABIC))
            }
            supplier.since?.let { Stat(icon = null, value = "منذ $it") }
        }

        // Follow button
        Row(
            Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(if (isFollowing) cs.surfaceVariant else cs.primary)
                .clickable(onClick = onToggleFollow)
                .padding(horizontal = 20.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                if (isFollowing) Icons.Filled.Check else Icons.Outlined.Add,
                contentDescription = null,
                tint = if (isFollowing) cs.onSurface else cs.onPrimary,
                modifier = Modifier.size(16.dp),
            )
            Text(
                if (isFollowing) "متابَع" else "متابعة",
                color = if (isFollowing) cs.onSurface else cs.onPrimary,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.labelMedium,
            )
        }

        val description = supplier.displayDescription(IS_ARABIC)
        if (description.isNotBlank()) {
            Text(description, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
        }
    }
}

@Composable
private fun Stat(icon: (@Composable () -> Unit)?, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        icon?.invoke()
        Text(value, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}
