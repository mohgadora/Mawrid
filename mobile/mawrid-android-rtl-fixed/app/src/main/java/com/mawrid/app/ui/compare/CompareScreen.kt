package com.mawrid.app.ui.compare

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.Product
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompareScreen(
    onBack: () -> Unit,
    onProductClick: (String) -> Unit,
    vm: CompareViewModel = hiltViewModel(),
) {
    val products by vm.products.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("مقارنة المنتجات") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
                actions = {
                    if (products.isNotEmpty()) TextButton(onClick = vm::clear) { Text("مسح الكل") }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            if (products.isEmpty()) {
                EmptyState("لا توجد منتجات للمقارنة — أضِف منتجات من صفحة المنتج")
            } else {
                Row(
                    Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    products.forEach { p ->
                        CompareColumn(p, onRemove = { vm.remove(p.id) }, onClick = { onProductClick(p.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun CompareColumn(product: Product, onRemove: () -> Unit, onClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    val retail = Money.format(Money.retailUsd(product.basePriceUsd), DISPLAY_CURRENCY, IS_ARABIC)
    Column(
        Modifier.width(170.dp).clip(RoundedCornerShape(12.dp)).background(cs.surface).padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(Modifier.fillMaxWidth()) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.displayName(IS_ARABIC),
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().height(120.dp).clip(RoundedCornerShape(8.dp)).background(cs.surfaceVariant).clickable(onClick = onClick),
            )
            IconButton(onClick = onRemove, modifier = Modifier.align(Alignment.TopEnd).size(28.dp)) {
                Icon(Icons.Filled.Close, contentDescription = "إزالة", tint = cs.error, modifier = Modifier.size(16.dp))
            }
        }
        Text(
            product.displayName(IS_ARABIC),
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.Bold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Text(retail, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black, color = cs.primary)

        Spacer(Modifier.height(4.dp))
        Attr("أقل كمية", "${product.moq} كرتون")
        Attr("التقييم", product.rating.toString(), star = true)
        product.unitsPerCarton?.let { Attr("الوحدات/كرتون", it.toString()) }
        Attr("عدد الأسعار", "${product.tiers.size}")
    }
}

@Composable
private fun Attr(label: String, value: String, star: Boolean = false) {
    val cs = MaterialTheme.colorScheme
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            if (star) Icon(Icons.Filled.Star, null, tint = MawridColors.StarAmber, modifier = Modifier.size(12.dp))
            Text(value, style = MaterialTheme.typography.labelMedium)
        }
    }
}
