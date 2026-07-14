package com.mawrid.app.ui.rewards

import android.content.Intent
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.ReferralEntry
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReferralScreen(
    onBack: () -> Unit,
    vm: ReferralViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ادعُ أصدقاءك") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض رمز الإحالة")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل رمز الإحالة")
                else -> {
                    val r = state.referral
                    LazyColumn(contentPadding = PaddingValues(16.dp)) {
                        item {
                            CodeCard(
                                code = r.code,
                                usageCount = r.usageCount,
                                onCopy = {
                                    clipboard.setText(AnnotatedString(r.code))
                                    scope.launch { snackbar.showSnackbar("تم نسخ الرمز") }
                                },
                                onShare = {
                                    val msg = "استخدم رمز الإحالة الخاص بي على مورِد: ${r.code}"
                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_TEXT, msg)
                                    }
                                    context.startActivity(Intent.createChooser(intent, "مشاركة الرمز"))
                                },
                            )
                        }
                        item { Spacer(Modifier.height(16.dp)) }
                        item {
                            Text("أصدقاؤك المُحالون", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                        if (r.entries.isEmpty()) {
                            item {
                                Text(
                                    "لم تُحل أحداً بعد — شارك رمزك وابدأ بكسب النقاط",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        } else {
                            items(r.entries, key = { it.id }) { e ->
                                ReferralRow(e)
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CodeCard(code: String, usageCount: Int, onCopy: () -> Unit, onShare: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(colors = CardDefaults.cardColors(containerColor = cs.primary)) {
        Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("رمز الإحالة الخاص بك", style = MaterialTheme.typography.bodyMedium, color = cs.onPrimary)
            Spacer(Modifier.height(6.dp))
            Text(
                code.ifBlank { "—" },
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = cs.onPrimary,
            )
            Text(
                "استُخدم $usageCount مرة",
                style = MaterialTheme.typography.labelMedium,
                color = cs.onPrimary,
                modifier = Modifier.padding(top = 4.dp),
            )
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // onPrimary content + border so the button is visible on the orange card.
                OutlinedButton(
                    onClick = onCopy,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = cs.onPrimary),
                    border = BorderStroke(1.dp, cs.onPrimary),
                ) {
                    Icon(Icons.Filled.ContentCopy, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("نسخ")
                }
                FilledTonalButton(onClick = onShare) {
                    Icon(Icons.Filled.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("مشاركة")
                }
            }
        }
    }
}

@Composable
private fun ReferralRow(e: ReferralEntry) {
    val cs = MaterialTheme.colorScheme
    val rewarded = e.status == "rewarded"
    Card {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (rewarded) "تمت المكافأة" else "قيد الانتظار",
                style = MaterialTheme.typography.bodyMedium,
                color = if (rewarded) cs.primary else cs.onSurfaceVariant,
                fontWeight = FontWeight.Medium,
            )
            if (e.referrerBonus > 0) {
                Text(
                    "+${e.referrerBonus} نقطة",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = cs.primary,
                )
            }
        }
    }
}
