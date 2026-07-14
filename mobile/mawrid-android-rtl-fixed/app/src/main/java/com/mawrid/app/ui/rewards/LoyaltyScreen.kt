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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.Loyalty
import com.mawrid.app.domain.model.LoyaltyEntry
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoyaltyScreen(
    onBack: () -> Unit,
    vm: LoyaltyViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showRedeem by remember { mutableStateOf(false) }

    // Toast on a successful redemption.
    LaunchedEffect(state.redeemedMessage) {
        state.redeemedMessage?.let {
            showRedeem = false
            snackbar.showSnackbar(it)
            vm.consumeRedeemedMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("نقاط الولاء") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض نقاطك")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل النقاط")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    item { BalanceCard(state.loyalty, onRedeem = { showRedeem = true }) }
                    item { Spacer(Modifier.height(16.dp)) }
                    item {
                        Text("آخر العمليات", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(8.dp))
                    }
                    if (state.loyalty.entries.isEmpty()) {
                        item {
                            Text(
                                "لا توجد عمليات بعد",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    } else {
                        items(state.loyalty.entries, key = { it.id }) { e ->
                            LedgerRow(e)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }

    if (showRedeem) {
        RedeemDialog(
            balance = state.loyalty.balance,
            submitting = state.redeeming,
            error = state.redeemError,
            onSubmit = { vm.redeem(it) },
            onDismiss = { showRedeem = false },
        )
    }
}

@Composable
private fun BalanceCard(loyalty: Loyalty, onRedeem: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(colors = CardDefaults.cardColors(containerColor = cs.primary)) {
        Column(Modifier.fillMaxWidth().padding(20.dp)) {
            Text("رصيد النقاط", style = MaterialTheme.typography.bodyMedium, color = cs.onPrimary)
            Text(
                "${loyalty.balance}",
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Black,
                color = cs.onPrimary,
            )
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Stat("مكتسبة", loyalty.lifetimeEarned, cs.onPrimary)
                Stat("مُحوّلة", loyalty.lifetimeRedeemed, cs.onPrimary)
            }
            Spacer(Modifier.height(16.dp))
            Button(onClick = onRedeem, enabled = loyalty.balance > 0, modifier = Modifier.fillMaxWidth()) {
                Text("تحويل النقاط")
            }
        }
    }
}

@Composable
private fun Stat(label: String, value: Int, color: androidx.compose.ui.graphics.Color) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = color)
        Text("$value", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun LedgerRow(e: LoyaltyEntry) {
    val cs = MaterialTheme.colorScheme
    val earn = e.points >= 0
    Card {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    labelForType(e.type),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                )
                if (!e.note.isNullOrBlank()) {
                    Text(e.note, style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
                }
            }
            Text(
                (if (earn) "+" else "") + "${e.points}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (earn) cs.primary else cs.error,
            )
        }
    }
}

private fun labelForType(type: String): String = when (type) {
    "earn" -> "اكتساب نقاط"
    "redeem" -> "تحويل نقاط"
    "adjust" -> "تعديل إداري"
    else -> "عملية"
}

@Composable
private fun RedeemDialog(
    balance: Int,
    submitting: Boolean,
    error: String?,
    onSubmit: (Int) -> Unit,
    onDismiss: () -> Unit,
) {
    var text by remember { mutableStateOf("") }
    val points = text.toIntOrNull() ?: 0
    val valid = points in 1..balance
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("تحويل النقاط") },
        text = {
            Column {
                Text(
                    "رصيدك الحالي: $balance نقطة",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = text,
                    onValueChange = { s -> text = s.filter { it.isDigit() } },
                    label = { Text("عدد النقاط") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
                if (error != null) {
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelSmall,
                        textAlign = TextAlign.Start,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(points) }, enabled = valid && !submitting) {
                Text(if (submitting) "جارٍ التحويل…" else "تأكيد")
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) { Text("إلغاء") }
        },
    )
}
