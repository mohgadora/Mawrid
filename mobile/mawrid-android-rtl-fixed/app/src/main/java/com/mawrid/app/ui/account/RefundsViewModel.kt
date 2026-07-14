package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.RefundRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class RefundsUiState(
    val loading: Boolean = true,
    val refunds: List<RefundRequest> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class RefundsViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(RefundsUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<RefundsUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.refunds()
                .onSuccess { list -> _state.update { it.copy(loading = false, refunds = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
