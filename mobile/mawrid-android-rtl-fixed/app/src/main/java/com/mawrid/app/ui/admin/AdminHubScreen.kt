package com.mawrid.app.ui.admin

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.AdminKpi
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

private fun money(usd: Double) = Money.format(usd, DISPLAY_CURRENCY, IS_ARABIC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminHubScreen(
    onBack: () -> Unit,
    onOrders: () -> Unit,
    onProducts: () -> Unit,
    onBuyers: () -> Unit,
    onSuppliers: () -> Unit,
    onApprovals: () -> Unit,
    onSection: (String) -> Unit,
    vm: AdminDashboardViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("لوحة الإدارة") },
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
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل اللوحة")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    state.kpi?.let { item { KpiGrid(it); Spacer(Modifier.height(16.dp)) } }
                    item {
                        Text("نظرة عامة", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                        Card(Modifier.fillMaxWidth()) {
                            Column {
                                HubRow("الطلبات", onOrders)
                                HorizontalDivider()
                                HubRow("المنتجات", onProducts)
                                HorizontalDivider()
                                HubRow("المشترون", onBuyers)
                                HorizontalDivider()
                                HubRow("الموردون", onSuppliers)
                                HorizontalDivider()
                                HubRow("الموافقات", onApprovals)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                    // All other admin sections, grouped, via the generic list screen.
                    AdminSections.groups.forEach { (groupTitle, sections) ->
                        item {
                            Text(groupTitle, style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(8.dp))
                            Card(Modifier.fillMaxWidth()) {
                                Column {
                                    sections.forEachIndexed { i, s ->
                                        if (i > 0) HorizontalDivider()
                                        HubRow(s.label, { onSection(s.key) })
                                    }
                                }
                            }
                            Spacer(Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiGrid(kpi: AdminKpi) {
    val cards = listOf(
        "إجمالي المبيعات" to money(kpi.gmvUsd),
        "الطلبات" to "${kpi.orders}",
        "قيد الانتظار" to "${kpi.pendingOrders}",
        "الموردون" to "${kpi.suppliers}",
        "المشترون" to "${kpi.buyers}",
        "موافقات معلّقة" to "${kpi.pendingApprovals}",
        "تذاكر مفتوحة" to "${kpi.openTickets}",
        "نمو الإيراد" to "${kpi.revenueGrowth}%",
    )
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.height(((cards.size + 1) / 2 * 92).dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        userScrollEnabled = false,
    ) {
        items(cards) { (label, value) -> KpiCard(label, value) }
    }
}

@Composable
private fun KpiCard(label: String, value: String) {
    val cs = MaterialTheme.colorScheme
    Card {
        Column(Modifier.fillMaxWidth().padding(14.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = cs.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = cs.primary)
        }
    }
}

@Composable
private fun HubRow(label: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
