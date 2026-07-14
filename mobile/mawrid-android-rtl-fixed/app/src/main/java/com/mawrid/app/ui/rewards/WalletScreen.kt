package com.mawrid.app.ui.rewards

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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.Wallet
import com.mawrid.app.domain.model.WalletEntry
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

private fun money(usd: Double) = Money.format(usd, DISPLAY_CURRENCY, IS_ARABIC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    onBack: () -> Unit,
    vm: WalletViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showTopup by remember { mutableStateOf(false) }

    LaunchedEffect(state.topupMessage) {
        state.topupMessage?.let {
            showTopup = false
            snackbar.showSnackbar(it)
            vm.consumeTopupMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("محفظتي") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض محفظتك")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل المحفظة")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    item { BalanceCard(state.wallet, onTopup = { showTopup = true }) }
                    item { Spacer(Modifier.height(16.dp)) }
                    item {
                        Text("آخر العمليات", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                    }
                    if (state.wallet.entries.isEmpty()) {
                        item {
                            Text(
                                "لا توجد عمليات بعد",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    } else {
                        items(state.wallet.entries, key = { it.id }) { e ->
                            LedgerRow(e)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }

    if (showTopup) {
        TopupDialog(
            submitting = state.toppingUp,
            error = state.topupError,
            onSubmit = { vm.topup(it) },
            onDismiss = { showTopup = false },
        )
    }
}

@Composable
private fun BalanceCard(wallet: Wallet, onTopup: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(colors = CardDefaults.cardColors(containerColor = cs.primary)) {
        Column(Modifier.fillMaxWidth().padding(20.dp)) {
            Text("الرصيد الحالي", style = MaterialTheme.typography.bodyMedium, color = cs.onPrimary)
            Text(
                money(wallet.balanceUsd),
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Black,
                color = cs.onPrimary,
            )
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Stat("إجمالي الإيداعات", money(wallet.lifetimeCreditUsd), cs.onPrimary)
                Stat("إجمالي السحوبات", money(wallet.lifetimeDebitUsd), cs.onPrimary)
            }
            Spacer(Modifier.height(16.dp))
            Button(onClick = onTopup, modifier = Modifier.fillMaxWidth()) { Text("شحن المحفظة") }
        }
    }
}

@Composable
private fun Stat(label: String, value: String, color: androidx.compose.ui.graphics.Color) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = color)
        Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun LedgerRow(e: WalletEntry) {
    val cs = MaterialTheme.colorScheme
    val credit = e.amountUsd >= 0
    Card {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(labelForType(e.type), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                if (!e.note.isNullOrBlank()) {
                    Text(e.note, style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
                }
            }
            Text(
                (if (credit) "+" else "−") + money(kotlin.math.abs(e.amountUsd)),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = if (credit) cs.primary else cs.error,
            )
        }
    }
}

private fun labelForType(type: String): String = when (type) {
    "topup" -> "شحن المحفظة"
    "purchase" -> "دفع طلب"
    "refund" -> "استرجاع"
    "bonus" -> "بونص"
    "cashback" -> "استرجاع نقدي"
    "loyalty_convert" -> "تحويل نقاط"
    "admin_credit" -> "إضافة إدارية"
    "admin_debit" -> "خصم إداري"
    else -> "عملية"
}

@Composable
private fun TopupDialog(
    submitting: Boolean,
    error: String?,
    onSubmit: (Double) -> Unit,
    onDismiss: () -> Unit,
) {
    var text by remember { mutableStateOf("") }
    val amount = text.toDoubleOrNull() ?: 0.0
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("شحن المحفظة") },
        text = {
            Column {
                Text(
                    "في الإنتاج يمرّ الشحن عبر بوابة دفع مُتحقَّقة.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = text,
                    onValueChange = { s -> text = s.filter { it.isDigit() || it == '.' } },
                    label = { Text("المبلغ بالدولار") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
                if (error != null) {
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(amount) }, enabled = amount > 0 && !submitting) {
                Text(if (submitting) "جارٍ الشحن…" else "تأكيد الشحن")
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) { Text("إلغاء") }
        },
    )
}
