package com.mawrid.app.ui.rewards

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.Referral
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReferralUiState(
    val loading: Boolean = true,
    val referral: Referral = Referral.EMPTY,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class ReferralViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ReferralUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<ReferralUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.referral()
                .onSuccess { r -> _state.update { it.copy(loading = false, referral = r) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
