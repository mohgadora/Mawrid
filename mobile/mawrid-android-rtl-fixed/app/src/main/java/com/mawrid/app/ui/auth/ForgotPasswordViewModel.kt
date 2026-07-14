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

data class ForgotPasswordUiState(
    val email: String = "",
    val sending: Boolean = false,
    val error: String? = null,
    val sent: Boolean = false,
) {
    val canSubmit: Boolean get() = email.contains("@") && !sending
}

@HiltViewModel
class ForgotPasswordViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ForgotPasswordUiState())
    val state: StateFlow<ForgotPasswordUiState> = _state.asStateFlow()

    fun onEmail(v: String) = _state.update { it.copy(email = v) }

    fun submit() {
        val s = _state.value
        if (!s.canSubmit) return
        _state.update { it.copy(sending = true, error = null) }
        viewModelScope.launch {
            auth.requestPasswordReset(s.email)
                .onSuccess { _state.update { it.copy(sending = false, sent = true) } }
                .onFailure { e -> _state.update { it.copy(sending = false, error = e.message ?: "تعذّر الإرسال") } }
        }
    }
}
