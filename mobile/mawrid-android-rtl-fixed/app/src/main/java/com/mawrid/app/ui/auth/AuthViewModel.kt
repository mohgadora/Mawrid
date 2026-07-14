package com.mawrid.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class AuthMode { SIGN_IN, SIGN_UP }

data class AuthUiState(
    val mode: AuthMode = AuthMode.SIGN_IN,
    val email: String = "",
    val password: String = "",
    val name: String = "",
    val phone: String = "",
    val company: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
) {
    val canSubmit: Boolean
        get() = email.isNotBlank() && password.length >= 6 &&
            (mode == AuthMode.SIGN_IN || name.isNotBlank()) && !loading
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    fun onEmail(v: String) = _state.update { it.copy(email = v, error = null) }
    fun onPassword(v: String) = _state.update { it.copy(password = v, error = null) }
    fun onName(v: String) = _state.update { it.copy(name = v, error = null) }
    fun onPhone(v: String) = _state.update { it.copy(phone = v) }
    fun onCompany(v: String) = _state.update { it.copy(company = v) }

    fun toggleMode() = _state.update {
        it.copy(mode = if (it.mode == AuthMode.SIGN_IN) AuthMode.SIGN_UP else AuthMode.SIGN_IN, error = null)
    }

    fun submit() {
        val s = _state.value
        if (!s.canSubmit) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val result = when (s.mode) {
                AuthMode.SIGN_IN -> auth.signIn(s.email, s.password)
                AuthMode.SIGN_UP -> auth.signUp(s.email, s.password, s.name, s.phone, s.company)
            }
            result
                .onSuccess { _state.update { it.copy(loading = false, success = true) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "تعذّر تسجيل الدخول") } }
        }
    }
}
