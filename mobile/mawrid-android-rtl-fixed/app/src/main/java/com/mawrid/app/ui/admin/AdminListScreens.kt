package com.mawrid.app.ui.admin

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.core.money.Money
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

private fun money(usd: Double) = Money.format(usd, DISPLAY_CURRENCY, IS_ARABIC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminListScaffold(
    title: String,
    onBack: () -> Unit,
    loading: Boolean,
    error: String?,
    empty: Boolean,
    onRetry: () -> Unit,
    content: LazyListScopeContent,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
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
                loading -> LoadingState()
                error != null -> ErrorState(error, onRetry, title = "تعذّر التحميل")
                empty -> EmptyState("لا توجد بيانات")
                else -> LazyColumn(contentPadding = PaddingValues(12.dp)) { content() }
            }
        }
    }
}

private typealias LazyListScopeContent = androidx.compose.foundation.lazy.LazyListScope.() -> Unit

/** A two-line row card with an optional trailing chip. */
@Composable
private fun RowCard(primary: String, secondary: String, trailing: String? = null, trailingBold: Boolean = false) {
    val cs = MaterialTheme.colorScheme
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(primary, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (secondary.isNotBlank()) {
                    Text(secondary, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            if (trailing != null) {
                Text(
                    trailing,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = if (trailingBold) FontWeight.Black else FontWeight.Medium,
                    color = if (trailingBold) cs.primary else cs.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
fun AdminOrdersScreen(onBack: () -> Unit, vm: AdminOrdersViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()
    AdminListScaffold("الطلبات", onBack, s.loading, s.error, s.items.isEmpty(), vm::load) {
        items(s.items, key = { it.ref }) { o ->
            RowCard(
                primary = "${o.ref} · ${o.buyer}",
                secondary = "${o.items} صنف · ${o.status} · ${o.date}",
                trailing = money(o.amountUsd),
                trailingBold = true,
            )
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
fun AdminProductsScreen(onBack: () -> Unit, vm: AdminProductsViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()
    AdminListScaffold("المنتجات", onBack, s.loading, s.error, s.items.isEmpty(), vm::load) {
        items(s.items, key = { it.id }) { p ->
            RowCard(primary = p.name, secondary = p.status, trailing = if (p.active) "نشط" else "متوقف")
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
fun AdminBuyersScreen(onBack: () -> Unit, vm: AdminBuyersViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()
    AdminListScaffold("المشترون", onBack, s.loading, s.error, s.items.isEmpty(), vm::load) {
        items(s.items, key = { it.id }) { u ->
            RowCard(primary = u.name.ifBlank { u.email }, secondary = u.email, trailing = u.type)
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
fun AdminSuppliersScreen(onBack: () -> Unit, vm: AdminSuppliersViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()
    AdminListScaffold("الموردون", onBack, s.loading, s.error, s.items.isEmpty(), vm::load) {
        items(s.items, key = { it.id }) { sup ->
            RowCard(
                primary = sup.name,
                secondary = "${sup.products} منتج · ${sup.city}",
                trailing = if (sup.verified) "موثّق" else "معلّق",
            )
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
fun AdminApprovalsScreen(onBack: () -> Unit, vm: AdminApprovalsViewModel = hiltViewModel()) {
    val s by vm.state.collectAsStateWithLifecycle()
    AdminListScaffold("الموافقات", onBack, s.loading, s.error, s.items.isEmpty(), vm::load) {
        items(s.items, key = { it.id }) { a ->
            RowCard(primary = a.title, secondary = a.subtitle, trailing = a.status)
            Spacer(Modifier.height(8.dp))
        }
    }
}
