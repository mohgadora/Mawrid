package com.mawrid.app.ui.auth

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MarkEmailRead
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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    vm: ForgotPasswordViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("استعادة كلمة المرور") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            if (state.sent) {
                Column(
                    Modifier.fillMaxSize(),
                    verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(
                        Icons.Filled.MarkEmailRead,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    Text("تحقّق من بريدك", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "إن كان لديك حساب بهذا البريد، فستصلك رسالة لإعادة تعيين كلمة المرور.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 6.dp, start = 24.dp, end = 24.dp),
                    )
                    Button(onClick = onBack, modifier = Modifier.padding(top = 20.dp)) { Text("العودة لتسجيل الدخول") }
                }
            } else {
                Text(
                    "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = state.email,
                    onValueChange = vm::onEmail,
                    label = { Text("البريد الإلكتروني") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
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
                    Text(if (state.sending) "جارٍ الإرسال…" else "إرسال رابط الاستعادة")
                }
            }
        }
    }
}
