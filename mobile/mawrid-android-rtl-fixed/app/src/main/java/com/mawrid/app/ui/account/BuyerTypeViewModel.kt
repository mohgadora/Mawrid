package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.core.money.BuyerTypeStore
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BuyerTypeUiState(
    val loading: Boolean = true,
    val isMerchant: Boolean = false,
    val company: String = "",
    val saving: Boolean = false,
    val error: String? = null,
    val savedMessage: String? = null,
    val isLoggedIn: Boolean = false,
) {
    // A merchant switch needs a company name.
    val canSave: Boolean get() = !saving && (!isMerchant || company.isNotBlank())
}

@HiltViewModel
class BuyerTypeViewModel @Inject constructor(
    private val account: AccountRepository,
    private val buyerTypeStore: BuyerTypeStore,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(BuyerTypeUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<BuyerTypeUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.profile()
                .onSuccess { p ->
                    _state.update { it.copy(loading = false, isMerchant = p.role == "merchant", company = p.company) }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun select(merchant: Boolean) = _state.update { it.copy(isMerchant = merchant) }
    fun onCompany(v: String) = _state.update { it.copy(company = v) }

    fun save() {
        val s = _state.value
        if (!s.canSave) return
        _state.update { it.copy(saving = true, error = null) }
        viewModelScope.launch {
            account.setBuyerType(if (s.isMerchant) "merchant" else "consumer", s.company)
                .onSuccess { p ->
                    val merchant = p.role == "merchant"
                    buyerTypeStore.setMerchant(merchant)   // persists + flips Money.merchantPricing
                    _state.update { it.copy(saving = false, isMerchant = merchant, savedMessage = "تم تحديث نوع الحساب") }
                }
                .onFailure { e -> _state.update { it.copy(saving = false, error = e.message ?: "تعذّر الحفظ") } }
        }
    }

    fun consumeSavedMessage() = _state.update { it.copy(savedMessage = null) }
}
