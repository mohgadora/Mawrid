package com.mawrid.app.ui.rewards

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.Wallet
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WalletUiState(
    val loading: Boolean = true,
    val wallet: Wallet = Wallet.EMPTY,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val toppingUp: Boolean = false,
    val topupError: String? = null,
    val topupMessage: String? = null,
)

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(WalletUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<WalletUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.wallet()
                .onSuccess { w -> _state.update { it.copy(loading = false, wallet = w) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /** Top up [amountUsd]; refreshes on success. */
    fun topup(amountUsd: Double) {
        if (amountUsd <= 0 || _state.value.toppingUp) return
        _state.update { it.copy(toppingUp = true, topupError = null) }
        viewModelScope.launch {
            account.topupWallet(amountUsd)
                .onSuccess {
                    _state.update { it.copy(toppingUp = false, topupMessage = "تم شحن المحفظة") }
                    load()
                }
                .onFailure { e -> _state.update { it.copy(toppingUp = false, topupError = e.message ?: "تعذّر الشحن") } }
        }
    }

    fun consumeTopupMessage() = _state.update { it.copy(topupMessage = null) }
}
