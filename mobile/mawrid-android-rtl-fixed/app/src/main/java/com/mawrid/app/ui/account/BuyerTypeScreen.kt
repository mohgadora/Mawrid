package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BuyerTypeScreen(
    onBack: () -> Unit,
    vm: BuyerTypeViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.savedMessage) {
        state.savedMessage?.let {
            snackbar.showSnackbar(it)
            vm.consumeSavedMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("نوع الحساب") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لتغيير نوع الحساب")
                state.loading -> LoadingState()
                else -> Column(Modifier.fillMaxSize().padding(16.dp)) {
                    Text(
                        "اختر طريقة عرض الأسعار. التاجر يرى أسعار الجملة، والمستهلك يرى أسعار التجزئة.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    Option("مستهلك (أسعار التجزئة)", selected = !state.isMerchant, onClick = { vm.select(false) })
                    Option("تاجر (أسعار الجملة)", selected = state.isMerchant, onClick = { vm.select(true) })

                    if (state.isMerchant) {
                        OutlinedTextField(
                            value = state.company,
                            onValueChange = vm::onCompany,
                            label = { Text("اسم المنشأة") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        )
                    }
                    if (state.error != null) {
                        Text(
                            state.error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    }
                    Button(
                        onClick = vm::save,
                        enabled = state.canSave,
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    ) {
                        Text(if (state.saving) "جارٍ الحفظ…" else "حفظ")
                    }
                }
            }
        }
    }
}

@Composable
private fun Option(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().selectable(selected, onClick = onClick).padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RadioButton(selected = selected, onClick = onClick)
        Text(label, style = MaterialTheme.typography.bodyLarge)
    }
}
