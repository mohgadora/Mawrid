package com.mawrid.app.ui.orders

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Button
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.domain.model.Order
import com.mawrid.app.domain.model.OrderEvent
import com.mawrid.app.domain.model.OrderLine
import com.mawrid.app.ui.UiDefaults.formatFinal
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    onBack: () -> Unit,
    vm: OrderDetailViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showRefund by remember { mutableStateOf(false) }

    LaunchedEffect(state.refundMessage) {
        state.refundMessage?.let {
            showRefund = false
            snackbar.showSnackbar(it)
            vm.consumeRefundMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.order?.ref ?: "الطلب") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.loading -> LoadingState()
                state.error != null && state.order == null ->
                    ErrorState(state.error, vm::load, title = "تعذّر تحميل الطلب")
                state.order != null -> OrderContent(
                    order = state.order!!,
                    cancelling = state.cancelling,
                    onCancel = vm::cancel,
                    onRequestRefund = { showRefund = true },
                )
            }
        }
    }

    if (showRefund) {
        RefundDialog(
            submitting = state.refunding,
            error = state.refundError,
            onSubmit = { reason, note -> vm.requestRefund(reason, note) },
            onDismiss = { showRefund = false },
        )
    }
}

@Composable
private fun OrderContent(order: Order, cancelling: Boolean, onCancel: () -> Unit, onRequestRefund: () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(shortDate(order.createdAtIso), color = MaterialTheme.colorScheme.onSurfaceVariant)
            OrderStatusChip(order.status)
        }

        Spacer(Modifier.height(16.dp))
        SectionTitle("تتبع الطلب")
        Timeline(order.timeline)

        Spacer(Modifier.height(16.dp))
        SectionTitle("المنتجات")
        order.lines.forEach { line ->
            OrderLineRow(line)
            HorizontalDivider()
        }

        Spacer(Modifier.height(12.dp))
        Totals(order)

        order.address?.let { addr ->
            Spacer(Modifier.height(16.dp))
            SectionTitle("عنوان التوصيل")
            Card(Modifier.fillMaxWidth().padding(top = 6.dp)) {
                Column(Modifier.padding(12.dp)) {
                    Text(addr.label, fontWeight = FontWeight.Bold)
                    Text("${addr.line1}، ${addr.city}", style = MaterialTheme.typography.bodyMedium)
                    Text(addr.phone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        if (order.status.isCancellable) {
            OutlinedButton(
                onClick = onCancel,
                enabled = !cancelling,
                modifier = Modifier.fillMaxWidth().padding(top = 20.dp),
            ) {
                Text(if (cancelling) "جارٍ الإلغاء…" else "إلغاء الطلب")
            }
        }
        if (order.status.isRefundable) {
            OutlinedButton(
                onClick = onRequestRefund,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            ) {
                Text("طلب استرجاع")
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

/** Reason picker + optional note for a refund request. */
@Composable
private fun RefundDialog(
    submitting: Boolean,
    error: String?,
    onSubmit: (reason: String, note: String?) -> Unit,
    onDismiss: () -> Unit,
) {
    val reasons = listOf(
        "damaged" to "منتج تالف",
        "wrong_item" to "منتج خاطئ",
        "not_as_described" to "غير مطابق للوصف",
        "missing" to "منتج ناقص",
        "other" to "سبب آخر",
    )
    var reason by remember { mutableStateOf(reasons.first().first) }
    var note by remember { mutableStateOf("") }
    val cs = MaterialTheme.colorScheme

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("طلب استرجاع") },
        text = {
            Column {
                reasons.forEach { (value, label) ->
                    Row(
                        Modifier.fillMaxWidth().selectable(reason == value, onClick = { reason = value }).padding(vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(selected = reason == value, onClick = { reason = value })
                        Text(label, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("ملاحظات (اختياري)") },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
                if (error != null) {
                    Text(error, color = cs.error, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp))
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(reason, note.ifBlank { null }) }, enabled = !submitting) {
                Text(if (submitting) "جارٍ الإرسال…" else "إرسال")
            }
        },
        dismissButton = { androidx.compose.material3.TextButton(onClick = onDismiss) { Text("إلغاء") } },
    )
}

@Composable
private fun Timeline(events: List<OrderEvent>) {
    Column(Modifier.padding(top = 8.dp)) {
        events.forEach { event ->
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                Box(
                    Modifier.size(10.dp).background(MaterialTheme.colorScheme.primary, CircleShape),
                )
                Text(
                    event.status.labelAr,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(start = 10.dp).weight(1f),
                )
                Text(
                    shortDate(event.atIso),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun OrderLineRow(line: OrderLine) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(
            model = line.imageUrl,
            contentDescription = line.name,
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(56.dp),
        )
        Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
            Text(line.name, style = MaterialTheme.typography.bodyMedium)
            Text(
                "${line.qty} × ${formatFinal(line.unitPriceUsd)}",
                style = MaterialTheme.typography.labelSmall.copy(
                    textDirection = TextDirection.Content,
                ),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Text(formatFinal(line.lineTotalUsd), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun Totals(order: Order) {
    Column(Modifier.fillMaxWidth()) {
        TotalRow("المجموع الفرعي", formatFinal(order.subtotalUsd))
        TotalRow("الشحن", if (order.shippingUsd <= 0.0) "مجاني" else formatFinal(order.shippingUsd))
        if (order.savingsUsd > 0) TotalRow("التوفير", "-" + formatFinal(order.savingsUsd))
        HorizontalDivider(Modifier.padding(vertical = 6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("الإجمالي", fontWeight = FontWeight.Bold)
            Text(formatFinal(order.totalUsd), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun TotalRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value)
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium)
}
