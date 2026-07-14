package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
fun VerifyPhoneScreen(
    onBack: () -> Unit,
    vm: VerifyPhoneViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("توثيق رقم الجوال") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            when {
                state.verified -> Column(
                    Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(
                        Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    Text("تم توثيق رقم جوالك", style = MaterialTheme.typography.titleMedium)
                    Button(onClick = onBack, modifier = Modifier.padding(top = 20.dp)) { Text("تم") }
                }

                state.step == OtpStep.PHONE -> {
                    Text(
                        "أدخل رقم جوالك وسنرسل لك رمز تحقق.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = state.phone,
                        onValueChange = vm::onPhone,
                        label = { Text("رقم الجوال") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Done),
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    )
                    ErrorText(state.error)
                    Button(
                        onClick = vm::sendCode,
                        enabled = state.canSend,
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    ) { Text(if (state.busy) "جارٍ الإرسال…" else "إرسال الرمز") }
                }

                else -> {
                    Text(
                        "أدخل الرمز المُرسَل إلى ${state.phone}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = state.code,
                        onValueChange = vm::onCode,
                        label = { Text("رمز التحقق") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    )
                    ErrorText(state.error)
                    Button(
                        onClick = vm::verify,
                        enabled = state.canVerify,
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    ) { Text(if (state.busy) "جارٍ التحقق…" else "تأكيد") }
                    TextButton(onClick = vm::editPhone, modifier = Modifier.fillMaxWidth()) {
                        Text("تعديل رقم الجوال")
                    }
                }
            }
        }
    }
}

@Composable
private fun ErrorText(error: String?) {
    if (error != null) {
        Text(
            error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall,
            textAlign = TextAlign.Start,
            modifier = Modifier.padding(top = 8.dp),
        )
    }
}
