package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KycScreen(
    onBack: () -> Unit,
    vm: KycViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.submittedMessage) {
        state.submittedMessage?.let {
            snackbar.showSnackbar(it)
            vm.consumeSubmittedMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("توثيق المنشأة") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لتوثيق منشأتك")
                state.loading -> LoadingState()
                else -> Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                ) {
                    StatusChip(state.status.status)
                    Text(
                        "وثّق منشأتك للحصول على أسعار التجّار ومزايا إضافية.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 8.dp, bottom = 12.dp),
                    )
                    OutlinedTextField(
                        value = state.company,
                        onValueChange = vm::onCompany,
                        label = { Text("اسم المنشأة") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    )
                    OutlinedTextField(
                        value = state.crNumber,
                        onValueChange = vm::onCr,
                        label = { Text("رقم السجل التجاري (اختياري)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    )
                    OutlinedTextField(
                        value = state.vatNumber,
                        onValueChange = vm::onVat,
                        label = { Text("الرقم الضريبي (اختياري)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    )
                    if (state.error != null) {
                        Text(
                            state.error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                    Button(
                        onClick = vm::submit,
                        enabled = state.canSubmit,
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    ) {
                        Text(if (state.submitting) "جارٍ الإرسال…" else "إرسال طلب التوثيق")
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val (label, color) = when (status) {
        "approved" -> "موثّقة" to MawridColors.StarAmber
        "pending" -> "قيد المراجعة" to MaterialTheme.colorScheme.primary
        "rejected" -> "مرفوضة" to MaterialTheme.colorScheme.error
        else -> "غير موثّقة" to MaterialTheme.colorScheme.onSurfaceVariant
    }
    AssistChip(
        onClick = {},
        enabled = false,
        label = { Text(label) },
        colors = AssistChipDefaults.assistChipColors(disabledLabelColor = color, disabledLeadingIconContentColor = color),
    )
}
