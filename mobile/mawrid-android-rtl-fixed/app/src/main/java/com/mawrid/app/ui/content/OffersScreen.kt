package com.mawrid.app.ui.content

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.ClearanceItem
import com.mawrid.app.domain.model.Deal
import com.mawrid.app.domain.model.FlashSale
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.LoadingState

private fun money(usd: Double) = Money.format(usd, DISPLAY_CURRENCY, IS_ARABIC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OffersScreen(
    onBack: () -> Unit,
    onProductClick: (String) -> Unit,
    vm: OffersViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("عروض وتخفيضات") },
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
                state.isEmpty -> EmptyState("لا توجد عروض نشطة حالياً")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    state.deal?.let { deal ->
                        item {
                            Text("عرض اليوم", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(8.dp))
                            DealCard(deal, onClick = { onProductClick(deal.productId) })
                            Spacer(Modifier.height(20.dp))
                        }
                    }
                    if (state.flashSales.isNotEmpty()) {
                        item {
                            Text("تخفيضات سريعة", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                        items(state.flashSales, key = { it.id }) { fs ->
                            FlashRow(fs)
                            Spacer(Modifier.height(8.dp))
                        }
                        item { Spacer(Modifier.height(12.dp)) }
                    }
                    if (state.clearance.isNotEmpty()) {
                        item {
                            Text("تصفية", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                        items(state.clearance, key = { it.productId }) { c ->
                            ClearanceRow(c, onClick = { onProductClick(c.productId) })
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DealCard(deal: Deal, onClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = cs.primaryContainer),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            if (deal.imageUrl != null) {
                AsyncImage(
                    model = deal.imageUrl,
                    contentDescription = deal.productName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(72.dp).clip(RoundedCornerShape(8.dp)),
                )
                Spacer(Modifier.size(12.dp))
            }
            Column(Modifier.clickable(onClick = onClick)) {
                Text(deal.title, style = MaterialTheme.typography.labelMedium, color = cs.onPrimaryContainer)
                Text(deal.productName, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(money(deal.salePriceUsd), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = cs.primary)
                    if (deal.basePriceUsd > deal.salePriceUsd) {
                        Text(
                            money(deal.basePriceUsd),
                            style = MaterialTheme.typography.bodySmall,
                            color = cs.onSurfaceVariant,
                            textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FlashRow(fs: FlashSale) {
    Card {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text(fs.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, modifier = Modifier.padding(start = 10.dp))
        }
    }
}

@Composable
private fun ClearanceRow(c: ClearanceItem, onClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            if (c.imageUrl != null) {
                AsyncImage(
                    model = c.imageUrl,
                    contentDescription = c.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(56.dp).clip(RoundedCornerShape(8.dp)),
                )
                Spacer(Modifier.size(12.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(c.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, maxLines = 2)
                Text(money(c.salePriceUsd), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = cs.primary)
            }
            if (c.discountPercent > 0) {
                Text("-${c.discountPercent}%", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black, color = cs.error)
            }
        }
    }
}
