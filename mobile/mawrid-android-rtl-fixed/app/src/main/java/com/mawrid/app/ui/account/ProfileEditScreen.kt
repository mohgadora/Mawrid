package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileEditScreen(
    onBack: () -> Unit,
    onVerifyPhone: () -> Unit = {},
    vm: ProfileEditViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    // Pop back once the save succeeds.
    LaunchedEffect(state.saved) { if (state.saved) onBack() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("تعديل الملف الشخصي") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        if (state.loading) {
            LoadingState(Modifier.padding(padding))
        } else {
            Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                OutlinedTextField(
                    value = state.name,
                    onValueChange = vm::onName,
                    label = { Text("الاسم") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                )
                OutlinedTextField(
                    value = state.phone,
                    onValueChange = vm::onPhone,
                    label = { Text("رقم الجوال") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                )
                OutlinedTextField(
                    value = state.email,
                    onValueChange = {},
                    label = { Text("البريد الإلكتروني") },
                    enabled = false,
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
                    onClick = vm::save,
                    enabled = state.canSave,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                ) {
                    Text(if (state.saving) "جارٍ الحفظ…" else "حفظ التغييرات")
                }
                androidx.compose.material3.OutlinedButton(
                    onClick = onVerifyPhone,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                ) {
                    Text("توثيق رقم الجوال")
                }
            }
        }
    }
}
