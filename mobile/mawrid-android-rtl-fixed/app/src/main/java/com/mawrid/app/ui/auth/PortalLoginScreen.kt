package com.mawrid.app.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.AdminPanelSettings
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PortalLoginScreen(
    onBack: () -> Unit,
    onAdmin: () -> Unit,
    onPartner: () -> Unit,
    vm: PortalLoginViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.destination) {
        when (state.destination) {
            PortalDestination.ADMIN -> { vm.consumeDestination(); onAdmin() }
            PortalDestination.PARTNER -> { vm.consumeDestination(); onPartner() }
            null -> Unit
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("بوابة الإدارة والشركاء") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Outlined.AdminPanelSettings,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.height(56.dp),
            )
            Spacer(Modifier.height(8.dp))
            Text("دخول الفريق", style = MaterialTheme.typography.titleLarge)
            Text(
                "للمسؤولين والموردين. سيتم توجيهك إلى لوحتك تلقائياً حسب نوع الحساب.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
            )
            OutlinedTextField(
                value = state.email,
                onValueChange = vm::onEmail,
                label = { Text("البريد الإلكتروني") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
            )
            OutlinedTextField(
                value = state.password,
                onValueChange = vm::onPassword,
                label = { Text("كلمة المرور") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
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
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            ) {
                if (state.loading) {
                    CircularProgressIndicator(Modifier.height(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text("تسجيل الدخول")
                }
            }
        }
    }
}
