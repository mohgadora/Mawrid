package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.Address
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddressesScreen(
    onBack: () -> Unit,
    vm: AddressesViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("العناوين") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
        floatingActionButton = {
            if (!state.showForm) {
                FloatingActionButton(onClick = vm::toggleForm) {
                    Icon(Icons.Filled.Add, contentDescription = "إضافة عنوان")
                }
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            if (state.showForm) {
                AddressForm(
                    label = state.label, onLabel = vm::onLabel,
                    line1 = state.line1, onLine1 = vm::onLine1,
                    city = state.city, onCity = vm::onCity,
                    phone = state.phone, onPhone = vm::onPhone,
                    canSave = state.formValid && !state.saving,
                    saving = state.saving,
                    onSave = vm::save,
                    onCancel = vm::toggleForm,
                )
            }
            when {
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل العناوين")
                state.addresses.isEmpty() && !state.showForm -> EmptyState("لا توجد عناوين محفوظة")
                else -> LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp)) {
                    items(state.addresses, key = { it.id }) { addr ->
                        AddressCard(addr)
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun AddressCard(addr: Address) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Text(addr.label, fontWeight = FontWeight.Bold)
            Text("${addr.line1}، ${addr.city}", style = MaterialTheme.typography.bodyMedium)
            Text(addr.phone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AddressForm(
    label: String, onLabel: (String) -> Unit,
    line1: String, onLine1: (String) -> Unit,
    city: String, onCity: (String) -> Unit,
    phone: String, onPhone: (String) -> Unit,
    canSave: Boolean,
    saving: Boolean,
    onSave: () -> Unit,
    onCancel: () -> Unit,
) {
    Card(Modifier.fillMaxWidth().padding(12.dp)) {
        Column(Modifier.padding(14.dp)) {
            Text("عنوان جديد", style = MaterialTheme.typography.titleMedium)
            Field(label, onLabel, "التسمية (المنزل/المكتب)")
            Field(line1, onLine1, "العنوان")
            Field(city, onCity, "المدينة")
            Field(phone, onPhone, "رقم الجوال")
            Row(Modifier.fillMaxWidth().padding(top = 8.dp)) {
                Button(onClick = onSave, enabled = canSave, modifier = Modifier.weight(1f)) {
                    Text(if (saving) "جارٍ الحفظ…" else "حفظ")
                }
                Spacer(Modifier.padding(horizontal = 6.dp))
                androidx.compose.material3.OutlinedButton(onClick = onCancel, modifier = Modifier.weight(1f)) {
                    Text("إلغاء")
                }
            }
        }
    }
}

@Composable
private fun Field(value: String, onValueChange: (String) -> Unit, label: String) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
    )
}
