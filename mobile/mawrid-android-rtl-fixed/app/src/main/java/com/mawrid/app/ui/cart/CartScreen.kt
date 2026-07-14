package com.mawrid.app.ui.cart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.domain.model.CartLine
import com.mawrid.app.domain.model.CartSummary
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.UiDefaults.formatFinal
import com.mawrid.app.ui.UiDefaults.formatRetail
import com.mawrid.app.ui.components.EmptyState

@Composable
fun CartScreen(
    onCheckout: () -> Unit,
    onBrowse: () -> Unit,
    vm: CartViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize()) {
        Header()
        if (state.isEmpty) {
            Column(Modifier.fillMaxSize()) {
                EmptyState("سلتك فارغة")
                Box(Modifier.fillMaxWidth().padding(16.dp), Alignment.Center) {
                    Button(onClick = onBrowse) { Text("تصفح المنتجات") }
                }
            }
        } else {
            LazyColumn(Modifier.weight(1f), contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp)) {
                items(state.lines, key = { it.key }) { line ->
                    CartLineRow(
                        line = line,
                        onIncrease = { vm.increase(line) },
                        onDecrease = { vm.decrease(line) },
                        onRemove = { vm.remove(line) },
                    )
                    Spacer(Modifier.height(10.dp))
                }
            }
            CartSummaryBar(summary = state.summary, onCheckout = onCheckout)
        }
    }
}

@Composable
private fun Header() {
    Surface(color = MaterialTheme.colorScheme.primary) {
        Text(
            "السلة",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
        )
    }
}

@Composable
private fun CartLineRow(
    line: CartLine,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onRemove: () -> Unit,
) {
    Card(shape = RoundedCornerShape(12.dp)) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = line.product.imageUrl,
                contentDescription = line.product.displayName(IS_ARABIC),
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(72.dp),
            )
            Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(
                    line.product.displayName(IS_ARABIC),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                line.variant?.let {
                    Text(
                        it.displayName(IS_ARABIC),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    formatRetail(line.unitPriceUsd) + " / كرتون",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    formatRetail(line.lineTotalUsd),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onRemove) {
                    Icon(
                        Icons.Outlined.Delete,
                        contentDescription = "حذف",
                        tint = MaterialTheme.colorScheme.error,
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedIconButton(onClick = onDecrease, enabled = line.qty > line.product.moq, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Filled.Remove, contentDescription = "إنقاص", modifier = Modifier.size(16.dp))
                    }
                    Text(
                        "${line.qty}",
                        style = MaterialTheme.typography.titleSmall,
                        modifier = Modifier.padding(horizontal = 10.dp),
                    )
                    OutlinedIconButton(onClick = onIncrease, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Filled.Add, contentDescription = "زيادة", modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun CartSummaryBar(summary: CartSummary, onCheckout: () -> Unit) {
    Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            SummaryRow("المجموع الفرعي", formatRetail(summary.subtotalUsd))
            SummaryRow(
                "الشحن",
                // Shipping is a flat delivery fee, not a wholesale good — FX-convert
                // only (formatFinal), never apply the consumer retail markup to it.
                if (summary.shippingUsd <= 0.0) "مجاني" else formatFinal(summary.shippingUsd),
            )
            if (summary.savingsUsd > 0) {
                SummaryRow("توفيرك", "-" + formatRetail(summary.savingsUsd), highlight = true)
            }
            HorizontalDivider(Modifier.padding(vertical = 8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("الإجمالي", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(
                    // totalUsd is already the consumer total (retail subtotal +
                    // flat shipping) — FX-convert only, no further markup.
                    formatFinal(summary.totalUsd),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Button(onClick = onCheckout, modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
                Text("إتمام الطلب")
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String, highlight: Boolean = false) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            color = if (highlight) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
        )
    }
}
