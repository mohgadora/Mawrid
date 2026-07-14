package com.mawrid.app.ui.account

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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.ReorderTemplate
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TemplatesScreen(
    onBack: () -> Unit,
    vm: TemplatesViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showSave by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let {
            showSave = false
            snackbar.showSnackbar(it)
            vm.consumeMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("قوالب إعادة الطلب") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض قوالبك")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل القوالب")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    item {
                        Button(
                            onClick = { showSave = true },
                            enabled = state.cartCount > 0 && !state.busy,
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text(if (state.cartCount > 0) "احفظ السلة الحالية كقالب" else "السلة فارغة") }
                        Spacer(Modifier.height(16.dp))
                    }
                    if (state.templates.isEmpty()) {
                        item {
                            Text(
                                "لا توجد قوالب بعد — احفظ سلتك لإعادة طلبها بنقرة",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    } else {
                        items(state.templates, key = { it.id }) { t ->
                            TemplateRow(t, busy = state.busy, onReorder = { vm.reorder(t) })
                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }
            }
        }
    }

    if (showSave) {
        SaveTemplateDialog(
            busy = state.busy,
            onSave = { vm.saveCurrentCart(it) },
            onDismiss = { showSave = false },
        )
    }
}

@Composable
private fun TemplateRow(t: ReorderTemplate, busy: Boolean, onReorder: () -> Unit) {
    Card {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(t.name.ifBlank { "قالب" }, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                Text(
                    "${t.items.size} صنف · ${t.totalCartons} كرتون",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            OutlinedButton(onClick = onReorder, enabled = !busy) { Text("إعادة الطلب") }
        }
    }
}

@Composable
private fun SaveTemplateDialog(busy: Boolean, onSave: (String) -> Unit, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf("") }
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("حفظ قالب") },
        text = {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("اسم القالب") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        },
        confirmButton = {
            Button(onClick = { onSave(name) }, enabled = name.isNotBlank() && !busy) {
                Text(if (busy) "جارٍ الحفظ…" else "حفظ")
            }
        },
        dismissButton = { androidx.compose.material3.TextButton(onClick = onDismiss) { Text("إلغاء") } },
    )
}
