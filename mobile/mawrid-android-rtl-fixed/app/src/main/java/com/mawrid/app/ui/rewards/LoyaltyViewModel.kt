package com.mawrid.app.ui.rewards

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.Loyalty
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoyaltyUiState(
    val loading: Boolean = true,
    val loyalty: Loyalty = Loyalty.EMPTY,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val redeeming: Boolean = false,
    val redeemError: String? = null,
    val redeemedMessage: String? = null,
)

@HiltViewModel
class LoyaltyViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(LoyaltyUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<LoyaltyUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.loyalty()
                .onSuccess { l -> _state.update { it.copy(loading = false, loyalty = l) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    /** Redeem [points]; refreshes the ledger on success. Server rejects if balance is short. */
    fun redeem(points: Int) {
        if (points <= 0 || _state.value.redeeming) return
        _state.update { it.copy(redeeming = true, redeemError = null) }
        viewModelScope.launch {
            account.redeemPoints(points)
                .onSuccess {
                    _state.update { it.copy(redeeming = false, redeemedMessage = "تم تحويل $points نقطة") }
                    load()
                }
                .onFailure { e -> _state.update { it.copy(redeeming = false, redeemError = e.message ?: "تعذّر التحويل") } }
        }
    }

    fun consumeRedeemedMessage() = _state.update { it.copy(redeemedMessage = null) }
}
