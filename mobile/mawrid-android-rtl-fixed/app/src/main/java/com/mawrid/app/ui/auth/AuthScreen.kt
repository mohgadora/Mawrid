package com.mawrid.app.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    onAuthenticated: () -> Unit,
    onBack: () -> Unit,
    onForgotPassword: () -> Unit,
    onPortalLogin: () -> Unit,
    vm: AuthViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val signUp = state.mode == AuthMode.SIGN_UP

    // Navigate away once sign-in/up succeeds.
    LaunchedEffect(state.success) {
        if (state.success) onAuthenticated()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (signUp) "إنشاء حساب" else "تسجيل الدخول") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            if (signUp) {
                Field(state.name, vm::onName, "الاسم")
                Field(state.phone, vm::onPhone, "رقم الجوال", keyboard = KeyboardType.Phone)
                Field(state.company, vm::onCompany, "الشركة (اختياري)")
            }
            Field(state.email, vm::onEmail, "البريد الإلكتروني", keyboard = KeyboardType.Email)
            Field(
                state.password, vm::onPassword, "كلمة المرور",
                keyboard = KeyboardType.Password, isPassword = true, imeAction = ImeAction.Done,
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
                    CircularProgressIndicator(
                        modifier = Modifier.height(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text(if (signUp) "إنشاء حساب" else "تسجيل الدخول")
                }
            }

            Spacer(Modifier.height(8.dp))
            Column(Modifier.fillMaxWidth(), horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                TextButton(onClick = vm::toggleMode) {
                    Text(if (signUp) "لديك حساب؟ سجّل الدخول" else "ليس لديك حساب؟ أنشئ واحدًا")
                }
                if (!signUp) {
                    TextButton(onClick = onForgotPassword) { Text("نسيت كلمة المرور؟") }
                }
                androidx.compose.material3.HorizontalDivider(Modifier.padding(vertical = 8.dp))
                TextButton(onClick = onPortalLogin) { Text("دخول الفريق (الإدارة / الشركاء)") }
            }
        }
    }
}

@Composable
private fun Field(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    keyboard: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
    imeAction: ImeAction = ImeAction.Next,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboard, imeAction = imeAction),
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
    )
}
