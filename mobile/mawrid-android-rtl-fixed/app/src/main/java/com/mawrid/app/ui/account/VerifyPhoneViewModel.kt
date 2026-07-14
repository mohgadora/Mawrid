package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class OtpStep { PHONE, CODE }

data class VerifyPhoneUiState(
    val step: OtpStep = OtpStep.PHONE,
    val phone: String = "",
    val code: String = "",
    val busy: Boolean = false,
    val error: String? = null,
    val verified: Boolean = false,
) {
    val canSend: Boolean get() = phone.trim().length >= 8 && !busy
    val canVerify: Boolean get() = code.trim().length >= 4 && !busy
}

@HiltViewModel
class VerifyPhoneViewModel @Inject constructor(
    private val account: AccountRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(VerifyPhoneUiState())
    val state: StateFlow<VerifyPhoneUiState> = _state.asStateFlow()

    fun onPhone(v: String) = _state.update { it.copy(phone = v) }
    fun onCode(v: String) = _state.update { it.copy(code = v.filter { c -> c.isDigit() }) }

    fun sendCode() {
        val s = _state.value
        if (!s.canSend) return
        _state.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            account.sendOtp(s.phone)
                .onSuccess { _state.update { it.copy(busy = false, step = OtpStep.CODE) } }
                .onFailure { e -> _state.update { it.copy(busy = false, error = e.message ?: "تعذّر إرسال الرمز") } }
        }
    }

    fun verify() {
        val s = _state.value
        if (!s.canVerify) return
        _state.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            account.verifyOtp(s.phone, s.code)
                .onSuccess { ok -> _state.update { it.copy(busy = false, verified = ok, error = if (ok) null else "رمز غير صحيح") } }
                .onFailure { e -> _state.update { it.copy(busy = false, error = e.message ?: "تعذّر التحقق") } }
        }
    }

    fun editPhone() = _state.update { it.copy(step = OtpStep.PHONE, code = "", error = null) }
}
