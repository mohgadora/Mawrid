package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.KycStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class KycUiState(
    val loading: Boolean = true,
    val status: KycStatus = KycStatus.NONE,
    val company: String = "",
    val crNumber: String = "",
    val vatNumber: String = "",
    val submitting: Boolean = false,
    val error: String? = null,
    val submittedMessage: String? = null,
    val isLoggedIn: Boolean = false,
) {
    val canSubmit: Boolean get() = company.isNotBlank() && !submitting
}

@HiltViewModel
class KycViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(KycUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<KycUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.kyc()
                .onSuccess { s ->
                    _state.update { it.copy(loading = false, status = s, crNumber = s.crNumber, vatNumber = s.vatNumber) }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun onCompany(v: String) = _state.update { it.copy(company = v) }
    fun onCr(v: String) = _state.update { it.copy(crNumber = v) }
    fun onVat(v: String) = _state.update { it.copy(vatNumber = v) }

    fun submit() {
        val s = _state.value
        if (!s.canSubmit) return
        _state.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            account.submitKyc(s.company, s.crNumber, s.vatNumber)
                .onSuccess { st -> _state.update { it.copy(submitting = false, status = st, submittedMessage = "تم إرسال طلب التوثيق") } }
                .onFailure { e -> _state.update { it.copy(submitting = false, error = e.message ?: "تعذّر الإرسال") } }
        }
    }

    fun consumeSubmittedMessage() = _state.update { it.copy(submittedMessage = null) }
}
