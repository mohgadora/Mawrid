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

/** Where a successful staff login should land. */
enum class PortalDestination { ADMIN, PARTNER }

data class PortalLoginUiState(
    val email: String = "",
    val password: String = "",
    val loading: Boolean = false,
    val error: String? = null,
    val destination: PortalDestination? = null,
) {
    val canSubmit: Boolean get() = email.contains("@") && password.isNotBlank() && !loading
}

/**
 * Staff (admin / partner) sign-in. Uses the same better-auth credentials as the
 * buyer, then routes by the account's server role. Non-staff accounts are
 * rejected (and signed back out) so the buyer app isn't left in a half state.
 */
@HiltViewModel
class PortalLoginViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(PortalLoginUiState())
    val state: StateFlow<PortalLoginUiState> = _state.asStateFlow()

    fun onEmail(v: String) = _state.update { it.copy(email = v) }
    fun onPassword(v: String) = _state.update { it.copy(password = v) }

    fun submit() {
        val s = _state.value
        if (!s.canSubmit) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            auth.signIn(s.email, s.password)
                .onSuccess {
                    when (auth.currentUser()?.role) {
                        "admin" -> _state.update { it.copy(loading = false, destination = PortalDestination.ADMIN) }
                        "supplier" -> _state.update { it.copy(loading = false, destination = PortalDestination.PARTNER) }
                        else -> {
                            auth.signOut()
                            _state.update { it.copy(loading = false, error = "هذا الحساب ليس حساب إدارة أو شريك") }
                        }
                    }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "تعذّر تسجيل الدخول") } }
        }
    }

    fun consumeDestination() = _state.update { it.copy(destination = null) }
}
